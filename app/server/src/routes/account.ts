import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { isKnownTimeZone } from '../util.js';
import { ensureUnsubscribeToken } from '../reminders.js';

const router = Router();

/**
 * Unsubscribe is reached from a link in an email, so it must work without a
 * session. Registered before the auth guard below, and gated on the
 * unguessable per-user token instead.
 */
router.get('/unsubscribe', (req, res) => {
  const token = String(req.query.token || '');
  const user = token
    ? (db.prepare('SELECT id FROM users WHERE unsubscribe_token = ?').get(token) as { id: number } | undefined)
    : undefined;

  if (user) {
    db.prepare('UPDATE users SET reminder_email_enabled = 0 WHERE id = ?').run(user.id);
  }

  // Same page either way: a stale or already-used link shouldn't look broken,
  // and shouldn't confirm whether the token was real.
  res.type('html').send(
    `<!doctype html><html><body style="margin:0;padding:48px 24px;background:#0d0d0d;color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
      <div style="max-width:420px;margin:0 auto">
        <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#84868c;margin:0 0 20px">Winterwork</p>
        <h1 style="font-size:22px;font-weight:800;margin:0 0 12px">Reminders off</h1>
        <p style="font-size:15px;line-height:1.6;color:#c9cace;margin:0">You won't get daily reminder emails any more. You can turn them back on in Settings.</p>
      </div>
    </body></html>`
  );
});

router.use(requireAuth);

/** Reminder preferences. Defaults are off, so this only ever opts people in. */
router.get('/notifications', (req, res) => {
  const row = db
    .prepare('SELECT reminder_email_enabled, reminder_hour, timezone FROM users WHERE id = ?')
    .get(userIdOf(req)) as { reminder_email_enabled: number; reminder_hour: number; timezone: string | null };
  res.json({
    reminderEmailEnabled: !!row.reminder_email_enabled,
    reminderHour: row.reminder_hour,
    timezone: row.timezone,
  });
});

const notificationsSchema = z.object({
  reminderEmailEnabled: z.boolean().optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().max(64).optional(),
});

router.patch('/notifications', (req, res) => {
  const parsed = notificationsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const { reminderEmailEnabled, reminderHour, timezone } = parsed.data;

  if (reminderEmailEnabled !== undefined) {
    db.prepare('UPDATE users SET reminder_email_enabled = ? WHERE id = ?').run(
      reminderEmailEnabled ? 1 : 0,
      userId
    );
    // Mint the token on opt-in so the first reminder already has one to link.
    if (reminderEmailEnabled) ensureUnsubscribeToken(userId);
  }
  if (reminderHour !== undefined) {
    db.prepare('UPDATE users SET reminder_hour = ? WHERE id = ?').run(reminderHour, userId);
  }
  // Only store a zone the platform actually recognises, so the sweep never has
  // to reason about junk it was handed.
  if (timezone !== undefined && isKnownTimeZone(timezone)) {
    db.prepare('UPDATE users SET timezone = ? WHERE id = ?').run(timezone, userId);
  }

  const row = db
    .prepare('SELECT reminder_email_enabled, reminder_hour, timezone FROM users WHERE id = ?')
    .get(userId) as { reminder_email_enabled: number; reminder_hour: number; timezone: string | null };
  res.json({
    reminderEmailEnabled: !!row.reminder_email_enabled,
    reminderHour: row.reminder_hour,
    timezone: row.timezone,
  });
});

/**
 * Right to data portability: everything stored against the account, in one
 * machine-readable file. Tables are listed explicitly rather than discovered,
 * so a table added later can't silently be omitted from an export without
 * someone also failing the export test.
 */
router.get('/export', (req, res) => {
  const userId = userIdOf(req);

  const q = (sql: string, ...params: unknown[]) => db.prepare(sql).all(...params);

  const user = db
    .prepare(
      `SELECT id, email, name, goal, areas, arc_start_date, arc_length_days, onboarded,
              terms_version, privacy_version, consented_at, plan, plan_status, created_at
       FROM users WHERE id = ?`
    )
    .get(userId) as any;
  if (!user) return res.status(404).json({ error: 'not_found' });

  const payload = {
    exportedAt: new Date().toISOString(),
    format: 'winterwork.account-export.v1',
    account: { ...user, areas: JSON.parse(user.areas || '[]'), onboarded: !!user.onboarded },
    habits: q('SELECT * FROM habits WHERE user_id = ?', userId),
    habitEntries: q(
      'SELECT e.* FROM habit_entries e JOIN habits h ON h.id = e.habit_id WHERE h.user_id = ?',
      userId
    ),
    quitCounters: q('SELECT * FROM quit_counters WHERE user_id = ?', userId),
    cravingEpisodes: q(
      'SELECT c.* FROM craving_episodes c JOIN quit_counters q ON q.id = c.counter_id WHERE q.user_id = ?',
      userId
    ),
    relapses: q('SELECT r.* FROM relapses r JOIN quit_counters q ON q.id = r.counter_id WHERE q.user_id = ?', userId),
    moodEntries: q('SELECT * FROM mood_entries WHERE user_id = ?', userId),
    focusSessions: q('SELECT * FROM focus_sessions WHERE user_id = ?', userId),
    workoutPlanDays: q('SELECT * FROM workout_plan_days WHERE user_id = ?', userId),
    workoutSessions: q('SELECT * FROM workout_sessions WHERE user_id = ?', userId),
    sessionExercises: q(
      'SELECT sx.* FROM session_exercises sx JOIN workout_sessions ws ON ws.id = sx.session_id WHERE ws.user_id = ?',
      userId
    ),
    setEntries: q(
      `SELECT se.* FROM set_entries se
       JOIN session_exercises sx ON sx.id = se.session_exercise_id
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE ws.user_id = ?`,
      userId
    ),
    programProgress: q('SELECT * FROM program_progress WHERE user_id = ?', userId),
    bodyEntries: q('SELECT * FROM body_entries WHERE user_id = ?', userId),
    nutritionEntries: q('SELECT * FROM nutrition_entries WHERE user_id = ?', userId),
    foodEntries: q('SELECT * FROM food_entries WHERE user_id = ?', userId),
    cardioSessions: q('SELECT * FROM cardio_sessions WHERE user_id = ?', userId),
    cardioTrackPoints: q(
      'SELECT p.* FROM cardio_track_points p JOIN cardio_sessions c ON c.id = p.session_id WHERE c.user_id = ?',
      userId
    ),
    cardioSplits: q(
      'SELECT s.* FROM cardio_splits s JOIN cardio_sessions c ON c.id = s.session_id WHERE c.user_id = ?',
      userId
    ),
    stepEntries: q('SELECT * FROM step_entries WHERE user_id = ?', userId),
    tasks: q('SELECT * FROM tasks WHERE user_id = ?', userId),
    subtasks: q('SELECT s.* FROM subtasks s JOIN tasks t ON t.id = s.task_id WHERE t.user_id = ?', userId),
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="winterwork-export-${userId}.json"`);
  res.send(JSON.stringify(payload, null, 2));
});

export default router;
