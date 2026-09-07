import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { HABIT_CATEGORIES } from '../habitCategories.js';
import { computeStats } from '../streak.js';
import { addDays, scheduledOn, todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

function serializeHabit(row: any) {
  const entries = db
    .prepare('SELECT date, value FROM habit_entries WHERE habit_id = ? ORDER BY date DESC LIMIT 400')
    .all(row.id) as { date: string; value: number }[];
  const habit = {
    type: row.type as 'bool' | 'count' | 'time',
    schedule: JSON.parse(row.schedule),
    target: row.target,
  };
  const stats = computeStats(habit, entries);
  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);

  const forgiven = new Set(stats.forgiven);
  const week: { date: string; scheduled: boolean; done: boolean; forgiven: boolean; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const e = entries.find((x) => x.date === d);
    const scheduled = scheduledOn(habit.schedule, d);
    week.push({
      date: d,
      scheduled,
      done: scheduled && !!e && (habit.type === 'bool' ? e.value >= 1 : row.target != null ? e.value >= row.target : e.value > 0),
      forgiven: forgiven.has(d),
      value: e?.value ?? 0,
    });
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category,
    schedule: habit.schedule,
    target: row.target,
    unit: row.unit,
    step: row.step,
    archived: !!row.archived,
    todayValue: todayEntry?.value ?? 0,
    doneToday: habit.type === 'bool' ? (todayEntry?.value ?? 0) >= 1 : row.target != null ? (todayEntry?.value ?? 0) >= row.target : (todayEntry?.value ?? 0) > 0,
    scheduledToday: scheduledOn(habit.schedule, today),
    streak: stats.streak,
    best: stats.best,
    rate: stats.rate,
    // Days the streak survived without being completed, so the interface can
    // draw them as forgiven rather than as done or as a miss.
    forgiven: stats.forgiven,
    week,
  };
}

router.get('/', (req, res) => {
  const userId = userIdOf(req);
  const includeArchived = req.query.archived === '1';
  const rows = db
    .prepare(`SELECT * FROM habits WHERE user_id = ? ${includeArchived ? '' : 'AND archived = 0'} ORDER BY id ASC`)
    .all(userId);
  res.json({ habits: rows.map(serializeHabit) });
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(['bool', 'count', 'time']),
  category: z.enum(HABIT_CATEGORIES).default('GENERAL'),
  schedule: z.array(z.number().min(0).max(6)).min(1),
  target: z.number().positive().optional(),
  unit: z.string().optional(),
  step: z.number().positive().optional(),
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  const userId = userIdOf(req);
  const activeCount = (db.prepare('SELECT COUNT(*) as n FROM habits WHERE user_id = ? AND archived = 0').get(userId) as any).n;
  if (activeCount >= 24) return res.status(422).json({ error: 'Too many active habits. Archive one first.' });

  const h = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO habits (user_id, name, type, category, schedule, target, unit, step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, h.name, h.type, h.category, JSON.stringify(h.schedule), h.target ?? null, h.unit ?? null, h.step ?? null);
  const row = db.prepare('SELECT * FROM habits WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ habit: serializeHabit(row) });
});

function getOwnedHabit(userId: number, habitId: number) {
  return db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId) as any;
}

router.get('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwnedHabit(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });

  const entries = db
    .prepare('SELECT date, value, note FROM habit_entries WHERE habit_id = ? ORDER BY date DESC LIMIT 56')
    .all(row.id);
  res.json({ habit: serializeHabit(row), history: entries });
});

const completeSchema = z.object({
  value: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().optional(),
});

router.post('/:id/complete', (req, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const row = getOwnedHabit(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });

  const date = parsed.data.date || todayStr();
  const value = Math.max(0, parsed.data.value);
  db.prepare(
    `INSERT INTO habit_entries (habit_id, date, value, note) VALUES (?, ?, ?, ?)
     ON CONFLICT(habit_id, date) DO UPDATE SET value = excluded.value, note = excluded.note`
  ).run(row.id, date, value, parsed.data.note ?? null);

  res.json({ habit: serializeHabit(row) });
});

/**
 * Editing a habit. There was no way to do this at all: the only thing a habit
 * could be was archived, so a schedule set wrong at onboarding — where every
 * habit was created as seven days a week — could only be corrected by starting
 * a new habit and losing the streak with the old one.
 *
 * Entries are keyed by date and untouched here, so the streak survives an
 * edit; changing the schedule re-reads the same marks against the new days.
 */
const updateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  category: z.enum(HABIT_CATEGORIES).optional(),
  schedule: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  target: z.number().positive().nullable().optional(),
  unit: z.string().max(16).nullable().optional(),
  step: z.number().positive().nullable().optional(),
});

router.patch('/:id', (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  const userId = userIdOf(req);
  const row = getOwnedHabit(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });

  const d = parsed.data;
  if (d.name !== undefined) db.prepare('UPDATE habits SET name = ? WHERE id = ?').run(d.name, row.id);
  if (d.category !== undefined) db.prepare('UPDATE habits SET category = ? WHERE id = ?').run(d.category, row.id);
  if (d.schedule !== undefined) {
    // Deduplicated and sorted so two schedules meaning the same days are stored
    // the same way, and the week strip always draws in order.
    const days = [...new Set(d.schedule)].sort((a, b) => a - b);
    db.prepare('UPDATE habits SET schedule = ? WHERE id = ?').run(JSON.stringify(days), row.id);
  }
  if (d.target !== undefined) db.prepare('UPDATE habits SET target = ? WHERE id = ?').run(d.target, row.id);
  if (d.unit !== undefined) db.prepare('UPDATE habits SET unit = ? WHERE id = ?').run(d.unit, row.id);
  if (d.step !== undefined) db.prepare('UPDATE habits SET step = ? WHERE id = ?').run(d.step, row.id);

  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(row.id);
  res.json({ habit: serializeHabit(updated) });
});

router.patch('/:id/archive', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwnedHabit(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const archived = req.body?.archived ? 1 : 0;
  db.prepare('UPDATE habits SET archived = ? WHERE id = ?').run(archived, row.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwnedHabit(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM habits WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

export default router;
