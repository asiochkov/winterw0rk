import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { addDays, todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

function ensureToday(userId: number) {
  const today = todayStr();
  let row = db.prepare('SELECT * FROM step_entries WHERE user_id = ? AND date = ?').get(userId, today) as any;
  if (!row) {
    db.prepare('INSERT INTO step_entries (user_id, date, steps) VALUES (?, ?, 0)').run(userId, today);
    row = db.prepare('SELECT * FROM step_entries WHERE user_id = ? AND date = ?').get(userId, today);
  }
  return row;
}

function serialize(row: any) {
  return { date: row.date, steps: row.steps, goal: row.goal, source: row.source };
}

router.get('/today', (req, res) => {
  const userId = userIdOf(req);
  res.json({ entry: serialize(ensureToday(userId)) });
});

const syncSchema = z.object({
  steps: z.number().int().min(0).max(200000),
  source: z.enum(['sensor', 'manual']).default('sensor'),
});

/**
 * The client counts steps locally and reports a running total for the day.
 * Sensor syncs only ever move the count up — a page reload restarts the
 * on-device counter at zero, and that must not wipe the day's progress.
 * A manual correction is allowed to set any value, including a lower one.
 */
router.post('/sync', (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const current = ensureToday(userId);
  const { steps, source } = parsed.data;

  const next = source === 'manual' ? steps : Math.max(current.steps, steps);
  db.prepare("UPDATE step_entries SET steps = ?, source = ?, updated_at = datetime('now') WHERE id = ?").run(
    next,
    source,
    current.id
  );

  res.json({ entry: serialize(db.prepare('SELECT * FROM step_entries WHERE id = ?').get(current.id)) });
});

router.patch('/goal', (req, res) => {
  const parsed = z.object({ goal: z.number().int().min(500).max(100000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const current = ensureToday(userId);
  // The goal applies from today onward, so only today's row is updated.
  db.prepare('UPDATE step_entries SET goal = ? WHERE id = ?').run(parsed.data.goal, current.id);
  res.json({ entry: serialize(db.prepare('SELECT * FROM step_entries WHERE id = ?').get(current.id)) });
});

router.get('/history', (req, res) => {
  const userId = userIdOf(req);
  const since = addDays(todayStr(), -29);
  const rows = db
    .prepare('SELECT * FROM step_entries WHERE user_id = ? AND date >= ? ORDER BY date DESC')
    .all(userId, since) as any[];
  const total = rows.reduce((s, r) => s + r.steps, 0);
  res.json({
    entries: rows.map(serialize),
    total,
    dailyAverage: rows.length ? Math.round(total / rows.length) : 0,
  });
});

export default router;
