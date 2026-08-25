import crypto from 'node:crypto';
import { db } from './db.js';
import { config } from './config.js';
import { dailyReminderMail, mailerConfigured, sendMail } from './mailer.js';
import { scheduledOn, todayStr } from './util.js';

interface ReminderCandidate {
  id: number;
  email: string;
  unsubscribe_token: string | null;
}

export function ensureUnsubscribeToken(userId: number): string {
  const row = db.prepare('SELECT unsubscribe_token FROM users WHERE id = ?').get(userId) as
    | { unsubscribe_token: string | null }
    | undefined;
  if (row?.unsubscribe_token) return row.unsubscribe_token;
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('UPDATE users SET unsubscribe_token = ? WHERE id = ?').run(token, userId);
  return token;
}

/**
 * How many of today's scheduled habits are still open. Mirrors the completion
 * rule used by the habits API: booleans need a 1, targets need the target met.
 */
export function openHabitsToday(userId: number, date = todayStr()): { remaining: number; total: number } {
  const habits = db
    .prepare('SELECT id, type, schedule, target FROM habits WHERE user_id = ? AND archived = 0')
    .all(userId) as { id: number; type: string; schedule: string; target: number | null }[];

  let total = 0;
  let done = 0;
  for (const h of habits) {
    let schedule: number[];
    try {
      schedule = JSON.parse(h.schedule);
    } catch {
      continue;
    }
    if (!scheduledOn(schedule, date)) continue;
    total++;
    const entry = db
      .prepare('SELECT value FROM habit_entries WHERE habit_id = ? AND date = ?')
      .get(h.id, date) as { value: number } | undefined;
    const value = entry?.value ?? 0;
    const complete = h.type === 'bool' ? value >= 1 : h.target != null ? value >= h.target : value > 0;
    if (complete) done++;
  }
  return { remaining: total - done, total };
}

/**
 * Sends the daily nudge to everyone whose reminder hour has arrived and who
 * still has something open. Idempotent per user per day via
 * reminder_last_sent_date, so restarts inside the hour don't double-send.
 */
export async function runReminderSweep(now = new Date()): Promise<{ sent: number; skipped: number }> {
  if (!mailerConfigured()) return { sent: 0, skipped: 0 };

  const hour = now.getHours();
  const today = todayStr(now);

  const candidates = db
    .prepare(
      `SELECT id, email, unsubscribe_token FROM users
       WHERE reminder_email_enabled = 1
         AND status = 'active'
         AND reminder_hour = ?
         AND (reminder_last_sent_date IS NULL OR reminder_last_sent_date != ?)`
    )
    .all(hour, today) as ReminderCandidate[];

  let sent = 0;
  let skipped = 0;

  for (const user of candidates) {
    const { remaining, total } = openHabitsToday(user.id, today);
    if (remaining <= 0) {
      // Nothing to nag about. Mark the day done so we don't reconsider them hourly.
      db.prepare('UPDATE users SET reminder_last_sent_date = ? WHERE id = ?').run(today, user.id);
      skipped++;
      continue;
    }

    const token = user.unsubscribe_token || ensureUnsubscribeToken(user.id);
    try {
      await sendMail(
        dailyReminderMail(user.email, {
          remaining,
          total,
          unsubscribeUrl: `${config.appUrl}/api/account/unsubscribe?token=${token}`,
          appUrl: config.appUrl,
        })
      );
      db.prepare('UPDATE users SET reminder_last_sent_date = ? WHERE id = ?').run(today, user.id);
      sent++;
    } catch (err) {
      // Leave the date unset so the next sweep retries rather than silently dropping it.
      console.error(`[reminders] Failed to send to user ${user.id}:`, err);
    }
  }

  return { sent, skipped };
}

let timer: NodeJS.Timeout | null = null;

/** Checks every 15 minutes; the per-user hour + per-day guard does the real gating. */
export function startReminderScheduler(): void {
  if (timer || !config.remindersEnabled || !mailerConfigured()) return;
  const tick = () => {
    runReminderSweep().catch((err) => console.error('[reminders] Sweep failed:', err));
  };
  timer = setInterval(tick, 15 * 60 * 1000);
  // Don't hold the process open purely for reminders.
  timer.unref?.();
  tick();
}

export function stopReminderScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
