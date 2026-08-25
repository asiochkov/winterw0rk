import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

const startSchema = z.object({
  mode: z.enum(['pomodoro', 'deep', 'custom']),
  plannedSec: z.number().min(60).max(4 * 60 * 60),
});

router.post('/start', (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const info = db
    .prepare('INSERT INTO focus_sessions (user_id, mode, planned_sec) VALUES (?, ?, ?)')
    .run(userId, parsed.data.mode, parsed.data.plannedSec);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.post('/:id/finish', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM focus_sessions WHERE id = ? AND user_id = ?').get(Number(req.params.id), userId) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  const actualSec = Math.max(0, Number(req.body?.actualSec) || 0);
  const completed = actualSec >= row.planned_sec * 0.9 ? 1 : 0;
  db.prepare(
    "UPDATE focus_sessions SET actual_sec = ?, finished_at = datetime('now'), completed = ? WHERE id = ?"
  ).run(actualSec, completed, row.id);
  res.json({ ok: true, completed: !!completed });
});

router.get('/history', (req, res) => {
  const userId = userIdOf(req);
  const rows = db
    .prepare("SELECT * FROM focus_sessions WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY started_at DESC LIMIT 30")
    .all(userId);
  res.json({ sessions: rows });
});

router.get('/today', (req, res) => {
  const userId = userIdOf(req);
  const rows = db
    .prepare(
      "SELECT * FROM focus_sessions WHERE user_id = ? AND date(started_at) = ? AND finished_at IS NOT NULL ORDER BY started_at DESC"
    )
    .all(userId, todayStr());
  const totalSec = (rows as any[]).reduce((s, r) => s + (r.actual_sec || 0), 0);
  res.json({ sessions: rows, totalSec });
});

export default router;
