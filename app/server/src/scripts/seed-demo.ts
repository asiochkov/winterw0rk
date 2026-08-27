/**
 * Fills an account with the prototype's own data.
 *
 *   npm run seed-demo -- them@example.com
 *
 * Comparing a screen against `Winterwork v6.dc.html` needs the same figures on
 * both sides — v6 renders with nine habits, four of them closed, a workout
 * planned and a 23-day clean counter, and half of Today's blocks say nothing
 * on a fresh account. Every number below is copied from the HABITS and QUITS
 * arrays in the prototype rather than invented.
 *
 * This is a development tool. It replaces the account's habits and counters.
 */
import { db } from '../db.js';
import { todayStr } from '../util.js';

/** v6's week patterns: d = done, m = missed, t = today, f = not yet. */
type Mark = 'd' | 'm' | 't' | 'f';

interface SeedHabit {
  name: string;
  type: 'bool' | 'count' | 'time';
  category: string;
  schedule: number[];
  target?: number;
  unit?: string;
  step?: number;
  /** Value already logged today, for count and time habits. */
  todayValue?: number;
  doneToday: boolean;
  week: string;
}

const HABITS: SeedHabit[] = [
  { name: 'Workout', type: 'bool', category: 'TRAINING', schedule: [0, 1, 2, 3, 4, 5], doneToday: true, week: 'ddmddtf' },
  { name: 'Reading', type: 'bool', category: 'MIND', schedule: [0, 1, 2, 3, 4, 5, 6], doneToday: true, week: 'dddddtf' },
  { name: 'Cold Shower', type: 'bool', category: 'BODY', schedule: [0, 1, 2, 3, 4, 5, 6], doneToday: true, week: 'ddmddtf' },
  { name: 'Deep Work', type: 'bool', category: 'FOCUS', schedule: [0, 1, 2, 3, 4], doneToday: true, week: 'dmdddtf' },
  { name: 'Journal', type: 'bool', category: 'MIND', schedule: [0, 1, 2, 3, 4, 5, 6], doneToday: false, week: 'mdmmdtf' },
  { name: 'No Junk Food', type: 'bool', category: 'BODY', schedule: [0, 1, 2, 3, 4, 5, 6], doneToday: false, week: 'ddmddtf' },
  { name: 'Water', type: 'count', category: 'BODY', schedule: [0, 1, 2, 3, 4, 5, 6], target: 2, unit: 'L', step: 0.25, todayValue: 1.25, doneToday: false, week: 'ddmddtf' },
  { name: 'Steps', type: 'count', category: 'BODY', schedule: [0, 1, 2, 3, 4, 5, 6], target: 10000, unit: '', step: 1000, todayValue: 6400, doneToday: false, week: 'dddmdtf' },
  { name: 'Stretching', type: 'time', category: 'BODY', schedule: [1, 3, 5], target: 15, unit: 'MIN', step: 5, todayValue: 5, doneToday: false, week: 'fdfdftf' },
];

/** Days clean come straight from the prototype: 23, 9 and 2. */
const QUITS = [
  { kind: 'smoking', daysClean: 23, unitCost: 0.45, dailyAmount: 14, goalLabel: 'Bicycle', goalAmount: 600, best: 87, total: 134, attempts: 3 },
  { kind: 'sugar', daysClean: 9, unitCost: 1.5, dailyAmount: 3, goalLabel: null, goalAmount: null, best: 22, total: 61, attempts: 2 },
  { kind: 'social', daysClean: 2, unitCost: 0, dailyAmount: 3, goalLabel: null, goalAmount: null, best: 16, total: 48, attempts: 5 },
];

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run seed-demo -- <email>');
  process.exit(1);
}

const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as
  | { id: number; email: string }
  | undefined;

if (!user) {
  console.error(`No account found for ${email}. Sign up first, then re-run this.`);
  process.exit(1);
}

function dateNDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

const seed = db.transaction(() => {
  db.prepare('DELETE FROM habits WHERE user_id = ?').run(user!.id);
  db.prepare('DELETE FROM quit_counters WHERE user_id = ?').run(user!.id);

  // Monday-indexed, matching the prototype's week strings.
  const todayIdx = (new Date().getDay() + 6) % 7;

  for (const h of HABITS) {
    const info = db
      .prepare(
        `INSERT INTO habits (user_id, name, type, category, schedule, target, unit, step)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(user!.id, h.name, h.type, h.category, JSON.stringify(h.schedule), h.target ?? null, h.unit ?? null, h.step ?? null);
    const habitId = Number(info.lastInsertRowid);

    const entry = db.prepare('INSERT OR REPLACE INTO habit_entries (habit_id, date, value) VALUES (?, ?, ?)');
    h.week.split('').forEach((mark, i) => {
      if ((mark as Mark) !== 'd') return;
      const daysAgo = todayIdx - i;
      if (daysAgo <= 0) return; // today and the future are handled below
      entry.run(habitId, dateNDaysAgo(daysAgo), h.type === 'bool' ? 1 : (h.target ?? 1));
    });

    // Today's own value: closed for the first four, partial for the counters.
    const todayValue = h.doneToday ? (h.type === 'bool' ? 1 : (h.target ?? 1)) : (h.todayValue ?? 0);
    if (todayValue > 0) entry.run(habitId, todayStr(), todayValue);
  }

  for (const q of QUITS) {
    db.prepare(
      `INSERT INTO quit_counters (user_id, kind, start_date, unit_cost, daily_amount, goal_amount, goal_label,
                                  best_run_days, total_clean_days, attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      user!.id,
      q.kind,
      dateNDaysAgo(q.daysClean),
      q.unitCost,
      q.dailyAmount,
      q.goalAmount,
      q.goalLabel,
      q.best,
      q.total,
      q.attempts
    );
  }

  // v6 shows a session planned for today — "Upper body · Gym, 18 sets, about
  // 52 min" — so Today's next-step card and the Training screen have something
  // to say. Four exercises from whatever the library holds gives that shape.
  db.prepare("DELETE FROM workout_sessions WHERE user_id = ? AND date = ?").run(user!.id, todayStr());
  // Upper-body groups only, or the session contradicts its own name.
  const picks = db
    .prepare(
      `SELECT id FROM exercises
        WHERE group_name IN ('CHEST','BACK','SHOULDERS','ARMS')
        ORDER BY group_name, id LIMIT 4`
    )
    .all() as { id: string }[];

  if (picks.length) {
    const session = db
      .prepare("INSERT INTO workout_sessions (user_id, date, name, status) VALUES (?, ?, ?, 'planned')")
      .run(user!.id, todayStr(), 'Upper Body');
    const sessionId = Number(session.lastInsertRowid);
    picks.forEach((ex, i) => {
      db.prepare('INSERT INTO session_exercises (session_id, exercise_id, order_idx) VALUES (?, ?, ?)').run(
        sessionId,
        ex.id,
        i
      );
    });
  }

  // The prototype sits partway through a 90-day arc rather than on day one.
  db.prepare('UPDATE users SET arc_start_date = ?, arc_length_days = 90, onboarded = 1 WHERE id = ?').run(
    dateNDaysAgo(16),
    user!.id
  );
});

seed();

const closed = HABITS.filter((h) => h.doneToday).length;
console.log(
  `Seeded ${user.email}: ${HABITS.length} habits (${closed} closed today), ${QUITS.length} quit counters, one session planned for today.`
);
console.log('Arc starts 16 days ago, so Today shows day 17 — the prototype’s own default.');
