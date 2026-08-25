import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';

const router = Router();
router.use(requireAuth);

function serializeTask(row: any) {
  const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC').all(row.id) as any[];
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    weekday: row.weekday,
    recurrence: row.recurrence,
    backlog: !!row.backlog,
    done: !!row.done,
    subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, done: !!s.done })),
  };
}

router.get('/', (req, res) => {
  const userId = userIdOf(req);
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id ASC').all(userId);
  res.json({ tasks: rows.map(serializeTask) });
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  weekday: z.number().min(0).max(6).nullable().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).default('none'),
  backlog: z.boolean().default(false),
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  const userId = userIdOf(req);
  const t = parsed.data;
  const info = db
    .prepare('INSERT INTO tasks (user_id, title, priority, weekday, recurrence, backlog) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, t.title, t.priority, t.backlog ? null : t.weekday ?? null, t.recurrence, t.backlog ? 1 : 0);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ task: serializeTask(row) });
});

function getOwned(userId: number, id: number) {
  return db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as any;
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  weekday: z.number().min(0).max(6).nullable().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional(),
  backlog: z.boolean().optional(),
  done: z.boolean().optional(),
});

router.patch('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const t = parsed.data;
  db.prepare(
    `UPDATE tasks SET
      title = COALESCE(?, title),
      priority = COALESCE(?, priority),
      weekday = CASE WHEN ? THEN ? ELSE weekday END,
      recurrence = COALESCE(?, recurrence),
      backlog = COALESCE(?, backlog),
      done = COALESCE(?, done)
     WHERE id = ?`
  ).run(
    t.title ?? null,
    t.priority ?? null,
    'weekday' in t ? 1 : 0,
    t.weekday ?? null,
    t.recurrence ?? null,
    t.backlog === undefined ? null : t.backlog ? 1 : 0,
    t.done === undefined ? null : t.done ? 1 : 0,
    row.id
  );
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(row.id);
  res.json({ task: serializeTask(updated) });
});

router.delete('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

router.post('/:id/subtasks', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwned(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'invalid_input' });
  db.prepare('INSERT INTO subtasks (task_id, title) VALUES (?, ?)').run(row.id, title);
  res.status(201).json({ task: serializeTask(row) });
});

router.patch('/subtasks/:id', (req, res) => {
  const userId = userIdOf(req);
  const sub = db
    .prepare(
      `SELECT s.*, t.user_id as owner_id, t.id as task_id FROM subtasks s
       JOIN tasks t ON t.id = s.task_id WHERE s.id = ?`
    )
    .get(Number(req.params.id)) as any;
  if (!sub || sub.owner_id !== userId) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE subtasks SET done = ? WHERE id = ?').run(req.body?.done ? 1 : 0, sub.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(sub.task_id);
  res.json({ task: serializeTask(task) });
});

export default router;
