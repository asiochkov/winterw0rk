import { addDays, scheduledOn, todayStr, weekStartOf } from './util.js';

export interface HabitLike {
  type: 'bool' | 'count' | 'time';
  schedule: number[];
  target: number | null;
}

export interface EntryLike {
  date: string;
  value: number;
}

function isCompleted(habit: HabitLike, entry: EntryLike | undefined): boolean {
  if (!entry) return false;
  if (habit.type === 'bool') return entry.value >= 1;
  return habit.target != null ? entry.value >= habit.target : entry.value > 0;
}

/**
 * One missed day a week is forgiven rather than fatal.
 *
 * A tracker that zeroes a fifty-day streak because someone had flu on a
 * Tuesday teaches people that the number is fragile, and a fragile number is
 * one you stop looking at. The forgiven day is not counted as done — it is
 * marked as forgiven, which is a different thing and is drawn differently —
 * it simply does not break the run.
 *
 * A week gets exactly one. The second miss in the same week ends the streak,
 * so the mechanic cannot be leaned on as a schedule.
 *
 * Weeks are identified by their Monday, matching the schedule arrays.
 */
class GraceLedger {
  private spent = new Set<string>();

  /** Spends this week's grace if it is still available. */
  take(date: string): boolean {
    const week = weekStartOf(date);
    if (this.spent.has(week)) return false;
    this.spent.add(week);
    return true;
  }
}

export function computeStats(habit: HabitLike, entries: EntryLike[]) {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const today = todayStr();

  // Current streak: walk backward from today, skipping unscheduled days.
  let streak = 0;
  let cursor = today;
  const grace = new GraceLedger();
  const forgiven: string[] = [];
  for (let i = 0; i < 3650; i++) {
    if (!scheduledOn(habit.schedule, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const done = isCompleted(habit, byDate.get(cursor));
    if (done) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (cursor === today) {
      // today isn't done yet — doesn't break the streak, just isn't counted
      cursor = addDays(cursor, -1);
      continue;
    }
    if (grace.take(cursor)) {
      // Forgiven: the run continues past it, but the day is not counted as
      // done, so the streak number stays honest about what was actually done.
      forgiven.push(cursor);
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  // Best streak + 30-day consistency: scan the recorded date range
  // chronologically, forgiving on the same terms so the two numbers mean the
  // same thing.
  const dates = [...byDate.keys()].sort();
  let best = 0;
  let running = 0;
  const bestGrace = new GraceLedger();
  const earliest = dates[0] || today;
  let day = earliest;
  while (day <= today) {
    if (scheduledOn(habit.schedule, day)) {
      if (isCompleted(habit, byDate.get(day))) {
        running++;
        best = Math.max(best, running);
      } else if (day !== today) {
        // A run only survives a miss it can pay for, and only while it is
        // actually running — an unstarted run has nothing to protect.
        if (!(running > 0 && bestGrace.take(day))) running = 0;
      }
    }
    day = addDays(day, 1);
  }
  best = Math.max(best, streak);

  let scheduled30 = 0;
  let done30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, -i);
    if (scheduledOn(habit.schedule, d)) {
      scheduled30++;
      if (isCompleted(habit, byDate.get(d))) done30++;
    }
  }
  // Deliberately unforgiving: the rate says what share of scheduled days were
  // actually done. Counting a forgiven day here would make the figure flatter
  // to no one's benefit.
  const rate = scheduled30 > 0 ? Math.round((done30 / scheduled30) * 100) : 0;

  return { streak, best, rate, forgiven };
}
