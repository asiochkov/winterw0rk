import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { todayStr, weekdayOf } from '../util.js';

const router = Router();
router.use(requireAuth);

function exerciseRow(id: string) {
  return db.prepare('SELECT * FROM exercises WHERE id = ?').get(id) as any;
}

function previousBest(userId: number, exerciseId: string, beforeSessionId?: number) {
  const rows = db
    .prepare(
      `SELECT se.weight, se.reps FROM set_entries se
       JOIN session_exercises sx ON sx.id = se.session_exercise_id
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE ws.user_id = ? AND sx.exercise_id = ? AND ws.status = 'completed' AND se.is_warmup = 0
       ${beforeSessionId ? 'AND ws.id != ?' : ''}
       ORDER BY se.weight DESC, se.reps DESC LIMIT 1`
    )
    .get(...(beforeSessionId ? [userId, exerciseId, beforeSessionId] : [userId, exerciseId])) as any;
  return rows || null;
}

function serializeSession(sessionRow: any) {
  const exRows = db
    .prepare('SELECT * FROM session_exercises WHERE session_id = ? ORDER BY order_idx ASC')
    .all(sessionRow.id) as any[];
  const exercises = exRows.map((sx) => {
    const ex = exerciseRow(sx.exercise_id);
    const sets = db
      .prepare('SELECT * FROM set_entries WHERE session_exercise_id = ? ORDER BY set_index ASC')
      .all(sx.id) as any[];
    const prev = previousBest((sessionRow as any).user_id, sx.exercise_id, sessionRow.id);
    return {
      sessionExerciseId: sx.id,
      exerciseId: ex.id,
      name: ex.name,
      group: ex.group_name,
      equipment: ex.equipment,
      cue: ex.cue,
      errors: JSON.parse(ex.errors || '[]'),
      previous: prev ? { weight: prev.weight, reps: prev.reps } : null,
      sets: sets.map((s) => ({
        id: s.id,
        setIndex: s.set_index,
        weight: s.weight,
        reps: s.reps,
        isWarmup: !!s.is_warmup,
        completedAt: s.completed_at,
      })),
    };
  });
  return {
    id: sessionRow.id,
    date: sessionRow.date,
    name: sessionRow.name,
    status: sessionRow.status,
    startedAt: sessionRow.started_at,
    finishedAt: sessionRow.finished_at,
    durationSec: sessionRow.duration_sec,
    feeling: sessionRow.feeling,
    notes: sessionRow.notes,
    exercises,
  };
}

/**
 * The figures v6's Session summary shows: duration, working-set count,
 * tonnage and the exercises that beat their previous best. Computed on
 * demand so the summary screen can be reopened on a session that was
 * already finished, not only in the response to /finish.
 */
function summaryOf(userId: number, session: any) {
  const exRows = db.prepare('SELECT * FROM session_exercises WHERE session_id = ? ORDER BY order_idx ASC').all(session.id) as any[];
  let tonnage = 0;
  let setCount = 0;
  const prs: { exercise: string; weight: number; reps: number }[] = [];

  for (const sx of exRows) {
    const sets = db.prepare('SELECT * FROM set_entries WHERE session_exercise_id = ?').all(sx.id) as any[];
    const priorBest = previousBest(userId, sx.exercise_id, session.id);
    let sessionBestWeight = 0;
    let sessionBestReps = 0;
    for (const s of sets) {
      if (s.is_warmup) continue;
      setCount++;
      tonnage += (s.weight || 0) * (s.reps || 0);
      if ((s.weight || 0) > sessionBestWeight) {
        sessionBestWeight = s.weight || 0;
        sessionBestReps = s.reps || 0;
      }
    }
    if (sessionBestWeight > 0 && (!priorBest || sessionBestWeight > priorBest.weight)) {
      const ex = exerciseRow(sx.exercise_id);
      prs.push({ exercise: ex.name, weight: sessionBestWeight, reps: sessionBestReps });
    }
  }

  return { tonnage, setCount, prs };
}

/** v6 offers five faces on the summary screen and a single free-text note. */
const reflectionSchema = z.object({
  feeling: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

router.get('/today', (req, res) => {
  const userId = userIdOf(req);
  const today = todayStr();
  let session = db
    .prepare("SELECT * FROM workout_sessions WHERE user_id = ? AND date = ? AND status != 'skipped'")
    .get(userId, today) as any;

  if (!session) {
    const plan = db
      .prepare('SELECT * FROM workout_plan_days WHERE user_id = ? AND weekday = ?')
      .get(userId, weekdayOf(today)) as any;
    if (!plan) {
      return res.json({ session: null, restDay: true });
    }
    const exerciseIds: string[] = JSON.parse(plan.exercise_ids || '[]');
    const tx = db.transaction(() => {
      const info = db
        .prepare('INSERT INTO workout_sessions (user_id, date, name, status) VALUES (?, ?, ?, ?)')
        .run(userId, today, plan.name, 'planned');
      const insertEx = db.prepare(
        'INSERT INTO session_exercises (session_id, exercise_id, order_idx) VALUES (?, ?, ?)'
      );
      exerciseIds.forEach((exId, idx) => insertEx.run(info.lastInsertRowid, exId, idx));
      return info.lastInsertRowid;
    });
    const id = tx();
    session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(id);
  }

  res.json({ session: serializeSession(session), restDay: false });
});

function getOwnedSession(userId: number, id: number) {
  return db.prepare('SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?').get(id, userId) as any;
}

router.get('/sessions/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwnedSession(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ session: serializeSession(row) });
});

router.post('/sessions/:id/start', (req, res) => {
  const userId = userIdOf(req);
  const row = getOwnedSession(userId, Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.status === 'planned') {
    db.prepare("UPDATE workout_sessions SET status = 'active', started_at = datetime('now') WHERE id = ?").run(row.id);
  }
  const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(row.id);
  res.json({ session: serializeSession(updated) });
});

const setSchema = z.object({
  sessionExerciseId: z.number(),
  weight: z.number().min(0).nullable().optional(),
  reps: z.number().min(0).nullable().optional(),
  isWarmup: z.boolean().default(false),
});

router.post('/sessions/:id/sets', (req, res) => {
  const userId = userIdOf(req);
  const session = getOwnedSession(userId, Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'not_found' });
  const parsed = setSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const { sessionExerciseId, weight, reps, isWarmup } = parsed.data;

  const sx = db
    .prepare('SELECT * FROM session_exercises WHERE id = ? AND session_id = ?')
    .get(sessionExerciseId, session.id);
  if (!sx) return res.status(404).json({ error: 'exercise_not_in_session' });

  const nextIndex = ((db.prepare('SELECT MAX(set_index) as m FROM set_entries WHERE session_exercise_id = ?').get(sessionExerciseId) as any).m ?? -1) + 1;
  const info = db
    .prepare(
      `INSERT INTO set_entries (session_exercise_id, set_index, weight, reps, is_warmup, completed_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(sessionExerciseId, nextIndex, weight ?? null, reps ?? null, isWarmup ? 1 : 0);

  const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(session.id);
  res.status(201).json({ session: serializeSession(updated), setId: info.lastInsertRowid });
});

router.patch('/sets/:id', (req, res) => {
  const userId = userIdOf(req);
  const set = db
    .prepare(
      `SELECT se.*, ws.user_id as owner_id, ws.id as session_id FROM set_entries se
       JOIN session_exercises sx ON sx.id = se.session_exercise_id
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE se.id = ?`
    )
    .get(Number(req.params.id)) as any;
  if (!set || set.owner_id !== userId) return res.status(404).json({ error: 'not_found' });

  const weight = req.body?.weight;
  const reps = req.body?.reps;
  db.prepare('UPDATE set_entries SET weight = COALESCE(?, weight), reps = COALESCE(?, reps) WHERE id = ?').run(
    weight ?? null,
    reps ?? null,
    set.id
  );
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(set.session_id);
  res.json({ session: serializeSession(session) });
});

router.delete('/sets/:id', (req, res) => {
  const userId = userIdOf(req);
  const set = db
    .prepare(
      `SELECT se.*, ws.user_id as owner_id, ws.id as session_id FROM set_entries se
       JOIN session_exercises sx ON sx.id = se.session_exercise_id
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE se.id = ?`
    )
    .get(Number(req.params.id)) as any;
  if (!set || set.owner_id !== userId) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM set_entries WHERE id = ?').run(set.id);
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(set.session_id);
  res.json({ session: serializeSession(session) });
});

router.patch('/session-exercises/:id/swap', (req, res) => {
  const userId = userIdOf(req);
  const sx = db
    .prepare(
      `SELECT sx.*, ws.user_id as owner_id FROM session_exercises sx
       JOIN workout_sessions ws ON ws.id = sx.session_id
       WHERE sx.id = ?`
    )
    .get(Number(req.params.id)) as any;
  if (!sx || sx.owner_id !== userId) return res.status(404).json({ error: 'not_found' });

  const setCount = (db.prepare('SELECT COUNT(*) as n FROM set_entries WHERE session_exercise_id = ?').get(sx.id) as any).n;
  if (setCount > 0) return res.status(422).json({ error: 'Sets already logged for this exercise — undo them first to swap.' });

  const newExerciseId = String(req.body?.exerciseId || '');
  const exists = exerciseRow(newExerciseId);
  if (!exists) return res.status(400).json({ error: 'unknown_exercise' });

  db.prepare('UPDATE session_exercises SET exercise_id = ? WHERE id = ?').run(newExerciseId, sx.id);
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(sx.session_id);
  res.json({ session: serializeSession(session) });
});

/**
 * v6's Session summary is a screen of its own, reachable after the session is
 * already closed, so its figures come from here rather than from the response
 * to /finish.
 */
router.get('/sessions/:id/summary', (req, res) => {
  const userId = userIdOf(req);
  const session = getOwnedSession(userId, Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'not_found' });

  const { tonnage, setCount, prs } = summaryOf(userId, session);
  const durationSec = session.duration_sec ?? 0;
  res.json({ session: serializeSession(session), summary: { tonnage, setCount, durationSec, prs } });
});

/**
 * "How did it feel" and the session note are answered on the summary screen,
 * after /finish has already run, so they are saved separately.
 */
router.patch('/sessions/:id/reflection', (req, res) => {
  const userId = userIdOf(req);
  const session = getOwnedSession(userId, Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'not_found' });

  const parsed = reflectionSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'invalid_body' });

  const feeling = parsed.data.feeling ?? null;
  const notes = parsed.data.notes?.trim() ? parsed.data.notes.trim() : null;
  db.prepare('UPDATE workout_sessions SET feeling = ?, notes = ? WHERE id = ?').run(feeling, notes, session.id);

  const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(session.id);
  res.json({ session: serializeSession(updated) });
});

router.post('/sessions/:id/finish', (req, res) => {
  const userId = userIdOf(req);
  const session = getOwnedSession(userId, Number(req.params.id));
  if (!session) return res.status(404).json({ error: 'not_found' });

  const { tonnage, setCount, prs } = summaryOf(userId, session);

  const feeling = req.body?.feeling ?? null;
  const notes = req.body?.notes ?? null;
  const startedAt = session.started_at ? new Date(session.started_at + 'Z').getTime() : Date.now();
  const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

  db.prepare(
    `UPDATE workout_sessions
     SET status = 'completed', finished_at = datetime('now'), duration_sec = ?, feeling = ?, notes = ?
     WHERE id = ?`
  ).run(durationSec, feeling, notes, session.id);

  const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(session.id);
  res.json({ session: serializeSession(updated), summary: { tonnage, setCount, durationSec, prs } });
});

export default router;
