import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';

const router = Router();
router.use(requireAuth);

function withProgress(userId: number, row: any) {
  const progress = db
    .prepare('SELECT * FROM program_progress WHERE user_id = ? AND program_id = ?')
    .get(userId, row.id) as any;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    lengthDays: row.length_days,
    description: row.description,
    status: !progress ? 'not_started' : progress.completed ? 'completed' : 'in_progress',
    currentDay: progress?.current_day ?? 0,
  };
}

router.get('/', (req, res) => {
  const userId = userIdOf(req);
  const rows = db.prepare('SELECT * FROM programs ORDER BY length_days ASC').all() as any[];
  res.json({ programs: rows.map((r) => withProgress(userId, r)) });
});

router.get('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ program: withProgress(userId, row) });
});

router.post('/:id/start', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  db.prepare(
    'INSERT OR IGNORE INTO program_progress (user_id, program_id, current_day) VALUES (?, ?, 1)'
  ).run(userId, row.id);
  res.status(201).json({ program: withProgress(userId, row) });
});

router.post('/:id/advance', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  const progress = db
    .prepare('SELECT * FROM program_progress WHERE user_id = ? AND program_id = ?')
    .get(userId, row.id) as any;
  if (!progress) return res.status(422).json({ error: 'Start the program first.' });
  const nextDay = progress.current_day + 1;
  const completed = nextDay > row.length_days ? 1 : 0;
  db.prepare('UPDATE program_progress SET current_day = ?, completed = ? WHERE id = ?').run(
    Math.min(nextDay, row.length_days),
    completed,
    progress.id
  );
  res.json({ program: withProgress(userId, row) });
});

export default router;
