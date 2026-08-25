import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { daysBetween, todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

function serializeCounter(row: any) {
  const today = todayStr();
  const runDays = daysBetween(row.start_date, today);
  return {
    id: row.id,
    kind: row.kind,
    startDate: row.start_date,
    unitCost: row.unit_cost,
    dailyAmount: row.daily_amount,
    goalAmount: row.goal_amount,
    goalLabel: row.goal_label,
    runDays,
    bestRunDays: Math.max(row.best_run_days, runDays),
    totalCleanDays: row.total_clean_days + runDays,
    attempts: row.attempts,
    moneySaved: Math.round(runDays * row.daily_amount * row.unit_cost * 100) / 100,
    unitsAvoided: Math.round(runDays * row.daily_amount),
  };
}

function getOwned(userId: number, id: number) {
  return db.prepare('SELECT * FROM quit_counters WHERE id = ? AND user_id = ?').get(id, userId) as any;
}

router.get('/', (req, res) => {
  const userId = userIdOf(req);
  const rows = db.prepare('SELECT * FROM quit_counters WHERE user_id = ? AND archived = 0 ORDER BY id ASC').all(userId);
  res.json({ counters: rows.map(serializeCounter) });
});

const createSchema = z.object({
  kind: z.string().trim().min(1).max(40),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  unitCost: z.number().min(0).default(0),
  dailyAmount: z.number().min(0).default(0),
  goalAmount: z.number().min(0).optional(),
  goalLabel: z.string().optional(),
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  const userId = userIdOf(req);
  const c = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO quit_counters (user_id, kind, start_date, unit_cost, daily_amount, goal_amount, goal_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, c.kind, c.startDate || todayStr(), c.unitCost, c.dailyAmount, c.goalAmount ?? null, c.goalLabel ?? null);
  const row = db.prepare('SELECT * FROM quit_counters WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ counter: serializeCounter(row) });
});

router.get('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const cravings = db
    .prepare('SELECT * FROM craving_episodes WHERE counter_id = ? ORDER BY timestamp DESC LIMIT 30')
    .all(row.id);
  const relapses = db
    .prepare('SELECT * FROM relapses WHERE counter_id = ? ORDER BY timestamp DESC LIMIT 30')
    .all(row.id);
  res.json({ counter: serializeCounter(row), cravings, relapses });
});

const cravingSchema = z.object({
  intensity: z.number().min(1).max(5),
  trigger: z.string().optional(),
  copingAction: z.string().optional(),
});

router.post('/:id/craving', (req, res) => {
  const parsed = cravingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const c = parsed.data;
  db.prepare(
    'INSERT INTO craving_episodes (counter_id, intensity, trigger, coping_action) VALUES (?, ?, ?, ?)'
  ).run(row.id, c.intensity, c.trigger ?? null, c.copingAction ?? null);
  res.status(201).json({ ok: true });
});

const relapseSchema = z.object({
  trigger: z.string().optional(),
  note: z.string().optional(),
});

router.post('/:id/relapse', (req, res) => {
  const parsed = relapseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const today = todayStr();
  const endedRun = daysBetween(row.start_date, today);

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE quit_counters
       SET best_run_days = MAX(best_run_days, ?), total_clean_days = total_clean_days + ?, attempts = attempts + 1, start_date = ?
       WHERE id = ?`
    ).run(endedRun, endedRun, today, row.id);
    db.prepare('INSERT INTO relapses (counter_id, trigger, note, run_days) VALUES (?, ?, ?, ?)').run(
      row.id,
      parsed.data.trigger ?? null,
      parsed.data.note ?? null,
      endedRun
    );
  });
  tx();

  const updated = db.prepare('SELECT * FROM quit_counters WHERE id = ?').get(row.id);
  res.json({ counter: serializeCounter(updated) });
});

router.delete('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE quit_counters SET archived = 1 WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

export default router;
