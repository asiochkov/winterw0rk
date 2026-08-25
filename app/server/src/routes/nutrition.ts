import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { todayStr } from '../util.js';

const router = Router();
router.use(requireAuth);

function ensureToday(userId: number) {
  const today = todayStr();
  let row = db.prepare('SELECT * FROM nutrition_entries WHERE user_id = ? AND date = ?').get(userId, today) as any;
  if (!row) {
    db.prepare('INSERT INTO nutrition_entries (user_id, date) VALUES (?, ?)').run(userId, today);
    row = db.prepare('SELECT * FROM nutrition_entries WHERE user_id = ? AND date = ?').get(userId, today);
  }
  return row;
}

function serializeDay(userId: number, entry: any) {
  const foods = db
    .prepare('SELECT * FROM food_entries WHERE user_id = ? AND date = ? ORDER BY logged_at DESC')
    .all(userId, entry.date) as any[];
  const consumed = foods.reduce((s, f) => s + f.calories, 0);
  const protein = foods.reduce((s, f) => s + f.protein, 0);
  const carbs = foods.reduce((s, f) => s + f.carbs, 0);
  const fat = foods.reduce((s, f) => s + f.fat, 0);
  return {
    date: entry.date,
    calorieTarget: entry.calorie_target,
    proteinTarget: entry.protein_target,
    consumed,
    remaining: entry.calorie_target - consumed,
    protein,
    carbs,
    fat,
    waterMl: entry.water_ml,
    foods: foods.map((f) => ({ id: f.id, name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat })),
  };
}

router.get('/today', (req, res) => {
  const userId = userIdOf(req);
  const entry = ensureToday(userId);
  res.json({ day: serializeDay(userId, entry) });
});

router.patch('/today', (req, res) => {
  const userId = userIdOf(req);
  const entry = ensureToday(userId);
  const target = req.body?.calorieTarget;
  const proteinTarget = req.body?.proteinTarget;
  db.prepare('UPDATE nutrition_entries SET calorie_target = COALESCE(?, calorie_target), protein_target = COALESCE(?, protein_target) WHERE id = ?').run(
    target ?? null,
    proteinTarget ?? null,
    entry.id
  );
  res.json({ day: serializeDay(userId, db.prepare('SELECT * FROM nutrition_entries WHERE id = ?').get(entry.id)) });
});

router.post('/today/water', (req, res) => {
  const userId = userIdOf(req);
  const entry = ensureToday(userId);
  const deltaMl = Number(req.body?.deltaMl) || 0;
  db.prepare('UPDATE nutrition_entries SET water_ml = MAX(0, water_ml + ?) WHERE id = ?').run(deltaMl, entry.id);
  res.json({ day: serializeDay(userId, db.prepare('SELECT * FROM nutrition_entries WHERE id = ?').get(entry.id)) });
});

const foodSchema = z.object({
  name: z.string().trim().min(1).max(60),
  calories: z.number().min(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
});

router.post('/today/food', (req, res) => {
  const parsed = foodSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  const userId = userIdOf(req);
  const entry = ensureToday(userId);
  const f = parsed.data;
  db.prepare('INSERT INTO food_entries (user_id, date, name, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    userId,
    entry.date,
    f.name,
    f.calories,
    f.protein,
    f.carbs,
    f.fat
  );
  res.status(201).json({ day: serializeDay(userId, entry) });
});

router.delete('/food/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM food_entries WHERE id = ? AND user_id = ?').get(Number(req.params.id), userId) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM food_entries WHERE id = ?').run(row.id);
  const entry = db.prepare('SELECT * FROM nutrition_entries WHERE user_id = ? AND date = ?').get(userId, row.date);
  res.json({ day: serializeDay(userId, entry) });
});

export default router;
