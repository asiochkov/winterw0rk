import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

router.get('/today', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM mood_entries WHERE user_id = ? AND date = ?').get(userId, todayStr());
  res.json({ entry: row || null });
});

const schema = z.object({
  mood: z.number().min(1).max(5),
  tag: z.string().optional(),
  note: z.string().optional(),
});

router.post('/', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const { mood, tag, note } = parsed.data;
  const today = todayStr();
  db.prepare(
    `INSERT INTO mood_entries (user_id, date, mood, tag, note) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET mood = excluded.mood, tag = excluded.tag, note = excluded.note`
  ).run(userId, today, mood, tag ?? null, note ?? null);
  const row = db.prepare('SELECT * FROM mood_entries WHERE user_id = ? AND date = ?').get(userId, today);
  res.json({ entry: row });
});

router.get('/history', (req, res) => {
  const userId = userIdOf(req);
  const rows = db
    .prepare('SELECT * FROM mood_entries WHERE user_id = ? ORDER BY date DESC LIMIT 62')
    .all(userId);
  res.json({ entries: rows });
});

export default router;
