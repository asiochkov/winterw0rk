import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { addDays, scheduledOn, todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

/** v6's Progress reads a 30-day window with the previous 30 for comparison. */
const WINDOW = 30;

interface HabitRow {
  id: number;
  type: 'bool' | 'count' | 'time';
  schedule: string;
  target: number | null;
}

function completed(habit: { type: string; target: number | null }, value: number | undefined): boolean {
  if (value == null) return false;
  if (habit.type === 'bool') return value >= 1;
  return habit.target != null ? value >= habit.target : value > 0;
}

/**
 * Daily completion across every active habit, one entry per day.
 *
 * The Progress screen draws a 30-bar sparkline and a 7-bar week from the same
 * series, and states a delta against the previous 30 days — so all of it comes
 * from one pass rather than three queries that could disagree.
 */
router.get('/overview', (req, res) => {
  const userId = userIdOf(req);
  const today = todayStr();

  const habits = db
    .prepare('SELECT id, type, schedule, target FROM habits WHERE user_id = ? AND archived = 0')
    .all(userId) as HabitRow[];

  const parsed = habits.map((h) => {
    let schedule: number[] = [];
    try {
      schedule = JSON.parse(h.schedule);
    } catch {
      /* a habit with unreadable schedule counts as never scheduled */
    }
    return { ...h, scheduleDays: schedule };
  });

  const from = addDays(today, -(WINDOW * 2 - 1));
  const entries = db
    .prepare(
      `SELECT he.habit_id AS habitId, he.date, he.value
         FROM habit_entries he
         JOIN habits h ON h.id = he.habit_id
        WHERE h.user_id = ? AND he.date >= ?`
    )
    .all(userId, from) as { habitId: number; date: string; value: number }[];

  const byKey = new Map(entries.map((e) => [`${e.habitId}:${e.date}`, e.value]));

  /** One day: how many habits were due and how many were closed. */
  const dayAt = (date: string) => {
    let due = 0;
    let done = 0;
    for (const h of parsed) {
      if (!scheduledOn(h.scheduleDays, date)) continue;
      due++;
      if (completed(h, byKey.get(`${h.id}:${date}`))) done++;
    }
    return { date, due, done, pct: due ? Math.round((done / due) * 100) : 0 };
  };

  const days = Array.from({ length: WINDOW * 2 }, (_, i) => dayAt(addDays(today, -(WINDOW * 2 - 1 - i))));
  const current = days.slice(WINDOW);
  const previous = days.slice(0, WINDOW);

  /** Days with nothing due are excluded, or a rest day would read as a failure. */
  const rateOf = (window: typeof days) => {
    const active = window.filter((d) => d.due > 0);
    return active.length ? Math.round(active.reduce((s, d) => s + d.pct, 0) / active.length) : 0;
  };

  const rate = rateOf(current);
  const prevRate = rateOf(previous);

  const focusSec = (
    db
      .prepare(
        `SELECT COALESCE(SUM(actual_sec), 0) AS total FROM focus_sessions
          WHERE user_id = ? AND finished_at IS NOT NULL AND date(started_at) >= ?`
      )
      .get(userId, addDays(today, -(WINDOW - 1))) as { total: number }
  ).total;

  const sessions = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM workout_sessions
          WHERE user_id = ? AND status = 'completed' AND date >= ?`
      )
      .get(userId, addDays(today, -(WINDOW - 1))) as { n: number }
  ).n;

  const bestClean = (
    db
      .prepare(
        `SELECT COALESCE(MAX(julianday('now') - julianday(start_date)), 0) AS d
           FROM quit_counters WHERE user_id = ? AND archived = 0`
      )
      .get(userId) as { d: number }
  ).d;

  res.json({
    windowDays: WINDOW,
    rate,
    prevRate,
    delta: rate - prevRate,
    days: current,
    focusMinutes: Math.round(focusSec / 60),
    sessions,
    bestCleanDays: Math.floor(bestClean),
    habitCount: habits.length,
  });
});

export default router;
