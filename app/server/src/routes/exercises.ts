import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const group = String(req.query.group || '');
  const equipment = String(req.query.equipment || '');

  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const params: any[] = [];
  if (q) {
    sql += ' AND lower(name) LIKE ?';
    params.push(`%${q}%`);
  }
  if (group) {
    sql += ' AND group_name = ?';
    params.push(group);
  }
  if (equipment) {
    sql += ' AND equipment = ?';
    params.push(equipment);
  }
  sql += ' ORDER BY name ASC';
  const rows = db.prepare(sql).all(...params) as any[];
  res.json({
    exercises: rows.map((r) => ({
      id: r.id,
      name: r.name,
      group: r.group_name,
      equipment: r.equipment,
      level: r.level,
      type: r.type,
    })),
  });
});

router.get('/groups', (_req, res) => {
  const groups = db.prepare('SELECT DISTINCT group_name FROM exercises ORDER BY group_name').all() as any[];
  const equipment = db.prepare('SELECT DISTINCT equipment FROM exercises ORDER BY equipment').all() as any[];
  res.json({ groups: groups.map((g) => g.group_name), equipment: equipment.map((e) => e.equipment) });
});

router.get('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });

  const history = db
    .prepare(
      `SELECT ws.date, se.weight, se.reps FROM set_entries se
       JOIN session_exercises sx ON sx.id = se.session_exercise_id
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE ws.user_id = ? AND sx.exercise_id = ? AND ws.status = 'completed' AND se.is_warmup = 0
       ORDER BY ws.date DESC LIMIT 20`
    )
    .all(userId, row.id);

  const alternatives = db
    .prepare('SELECT id, name FROM exercises WHERE group_name = ? AND id != ? LIMIT 3')
    .all(row.group_name, row.id);

  res.json({
    exercise: {
      id: row.id,
      name: row.name,
      group: row.group_name,
      equipment: row.equipment,
      level: row.level,
      type: row.type,
      cue: row.cue,
      errors: JSON.parse(row.errors || '[]'),
    },
    history,
    alternatives,
  });
});

export default router;
