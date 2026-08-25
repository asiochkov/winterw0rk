import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { addDays, todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  weight: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  arms: z.number().positive().optional(),
  legs: z.number().positive().optional(),
});

router.post('/', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const userId = userIdOf(req);
  const today = todayStr();
  const existing = db.prepare('SELECT * FROM body_entries WHERE user_id = ? AND date = ?').get(userId, today) as any;
  const v = parsed.data;
  if (existing) {
    db.prepare(
      `UPDATE body_entries SET weight = COALESCE(?, weight), chest = COALESCE(?, chest), waist = COALESCE(?, waist),
       hips = COALESCE(?, hips), arms = COALESCE(?, arms), legs = COALESCE(?, legs) WHERE id = ?`
    ).run(v.weight ?? null, v.chest ?? null, v.waist ?? null, v.hips ?? null, v.arms ?? null, v.legs ?? null, existing.id);
  } else {
    db.prepare(
      `INSERT INTO body_entries (user_id, date, weight, chest, waist, hips, arms, legs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, today, v.weight ?? null, v.chest ?? null, v.waist ?? null, v.hips ?? null, v.arms ?? null, v.legs ?? null);
  }
  res.json({ ok: true });
});

router.get('/history', (req, res) => {
  const userId = userIdOf(req);
  const rows = db.prepare('SELECT * FROM body_entries WHERE user_id = ? ORDER BY date DESC LIMIT 90').all(userId);
  res.json({ entries: rows });
});

router.get('/summary', (req, res) => {
  const userId = userIdOf(req);
  const today = todayStr();
  const rows = db
    .prepare('SELECT date, weight FROM body_entries WHERE user_id = ? AND weight IS NOT NULL ORDER BY date DESC LIMIT 90')
    .all(userId) as { date: string; weight: number }[];

  const latest = rows[0] || null;
  const last7 = rows.filter((r) => r.date >= addDays(today, -6));
  const avg7 = last7.length ? last7.reduce((s, r) => s + r.weight, 0) / last7.length : null;
  const thirtyAgo = rows.find((r) => r.date <= addDays(today, -30));

  res.json({
    latest: latest ? latest.weight : null,
    avg7: avg7 ? Math.round(avg7 * 10) / 10 : null,
    deltaVs30d: latest && thirtyAgo ? Math.round((latest.weight - thirtyAgo.weight) * 10) / 10 : null,
  });
});

export default router;
