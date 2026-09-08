import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { computeStats, type HabitLike } from './streak.js';

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const BOOL: HabitLike = { type: 'bool', schedule: EVERY_DAY, target: null };

/** 2026-08-24 is a Monday, which keeps weekday-schedule cases easy to reason about. */
const TODAY = '2026-08-24';

function daysBefore(n: number, from = TODAY): string {
  const d = new Date(from + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function done(...offsets: number[]) {
  return offsets.map((o) => ({ date: daysBefore(o), value: 1 }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TODAY + 'T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('computeStats — current streak', () => {
  it('counts consecutive completed days ending today', () => {
    expect(computeStats(BOOL, done(0, 1, 2)).streak).toBe(3);
  });

  it('does not break the streak just because today is not done yet', () => {
    // Yesterday and the day before are done; today is still open.
    expect(computeStats(BOOL, done(1, 2)).streak).toBe(2);
  });

  it('forgives the first missed day of a week rather than breaking the streak', () => {
    // Today + 2 days ago done, yesterday missed. TODAY is a Monday, so
    // yesterday is the Sunday that closes the previous week and is the first
    // miss in it.
    const stats = computeStats(BOOL, done(0, 2));
    expect(stats.streak).toBe(2);
    // Forgiven, not done: the day is reported so the interface can draw it as
    // something other than a completed day.
    expect(stats.forgiven).toEqual([daysBefore(1)]);
  });

  it('breaks the streak on the second missed day of the same week', () => {
    // TODAY is Monday, so days 1-7 back are the whole previous week. Done on
    // today and 3 days back; days 1 and 2 back are both missed, in that week.
    const stats = computeStats(BOOL, done(0, 3));
    expect(stats.streak).toBe(1);
    expect(stats.forgiven).toEqual([daysBefore(1)]);
  });

  it('gives each week its own grace rather than one overall', () => {
    // Two misses a week apart: 1 day back (previous week) and 8 days back
    // (the week before that). Both are the first miss of their own week.
    const entries = done(0, 2, 3, 4, 5, 6, 7, 9, 10);
    const stats = computeStats(BOOL, entries);
    expect(stats.forgiven).toEqual([daysBefore(1), daysBefore(8)]);
    expect(stats.streak).toBe(9);
  });

  it('does not spend grace on today, which is merely unfinished', () => {
    // Yesterday and the day before are done, today is still open. Today must
    // not appear as forgiven — nothing has been missed yet.
    const stats = computeStats(BOOL, done(1, 2));
    expect(stats.forgiven).not.toContain(TODAY);
    expect(stats.streak).toBe(2);
  });

  it('is zero with no entries at all', () => {
    expect(computeStats(BOOL, []).streak).toBe(0);
  });

  it('skips unscheduled days rather than treating them as misses', () => {
    // Mon/Wed/Fri habit. Today is Monday. Completed today, last Friday, last Wednesday.
    const mwf: HabitLike = { type: 'bool', schedule: [0, 2, 4], target: null };
    const entries = [
      { date: TODAY, value: 1 },
      { date: daysBefore(3), value: 1 }, // Friday
      { date: daysBefore(5), value: 1 }, // Wednesday
    ];
    expect(computeStats(mwf, entries).streak).toBe(3);
  });
});

describe('computeStats — count and time habits', () => {
  const water: HabitLike = { type: 'count', schedule: EVERY_DAY, target: 2 };

  it('counts a day complete only once the target is reached', () => {
    expect(computeStats(water, [{ date: TODAY, value: 1.5 }]).streak).toBe(0);
    expect(computeStats(water, [{ date: TODAY, value: 2 }]).streak).toBe(1);
  });

  it('treats exceeding the target as complete', () => {
    expect(computeStats(water, [{ date: TODAY, value: 3 }]).streak).toBe(1);
  });

  it('falls back to any positive value when no target is set', () => {
    const untargeted: HabitLike = { type: 'count', schedule: EVERY_DAY, target: null };
    expect(computeStats(untargeted, [{ date: TODAY, value: 0 }]).streak).toBe(0);
    expect(computeStats(untargeted, [{ date: TODAY, value: 0.1 }]).streak).toBe(1);
  });
});

describe('computeStats — best streak', () => {
  it('remembers a longer past run after a break', () => {
    // A 4-day run a fortnight ago, then a miss, then a 2-day run ending today.
    const entries = [...done(0, 1), ...done(10, 11, 12, 13)];
    const stats = computeStats(BOOL, entries);
    expect(stats.streak).toBe(2);
    expect(stats.best).toBe(4);
  });

  it('is at least as large as the current streak', () => {
    const stats = computeStats(BOOL, done(0, 1, 2, 3, 4));
    expect(stats.best).toBeGreaterThanOrEqual(stats.streak);
    expect(stats.best).toBe(5);
  });
});

describe('computeStats — 30-day rate', () => {
  it('is 100% when every scheduled day in the window is done', () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({ date: daysBefore(i), value: 1 }));
    expect(computeStats(BOOL, entries).rate).toBe(100);
  });

  it('is 0% with no entries', () => {
    expect(computeStats(BOOL, []).rate).toBe(0);
  });

  it('reflects partial completion', () => {
    // 15 of the last 30 days.
    const entries = Array.from({ length: 15 }, (_, i) => ({ date: daysBefore(i * 2), value: 1 }));
    expect(computeStats(BOOL, entries).rate).toBe(50);
  });

  it('ignores entries older than the window', () => {
    expect(computeStats(BOOL, [{ date: daysBefore(60), value: 1 }]).rate).toBe(0);
  });

  it('counts only scheduled days in the denominator', () => {
    // Mon-only habit: ~4-5 Mondays in a 30-day window. Completing today (a Monday)
    // must not be diluted by the 25+ unscheduled days.
    const mondays: HabitLike = { type: 'bool', schedule: [0], target: null };
    const rate = computeStats(mondays, [{ date: TODAY, value: 1 }]).rate;
    expect(rate).toBeGreaterThan(15);
  });
});
