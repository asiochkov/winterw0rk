import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { todayStr } from '../util.js';
import { cleanTrack, elevationGainMeters, kilometreSplits, totalDistanceMeters, type TrackPoint } from '../geo.js';

const router = Router();
router.use(requireAuth);

const KCAL_PER_KM: Record<string, number> = { run: 65, walk: 50, bike: 30 };

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  altitude: z.number().nullable().optional(),
  accuracy: z.number().min(0).nullable().optional(),
  recordedAt: z.string().datetime(),
});

const schema = z.object({
  mode: z.enum(['run', 'walk', 'bike']),
  durationSec: z.number().min(1),
  // Manual entry supplies distanceKm; a GPS session supplies points and the server derives it.
  distanceKm: z.number().min(0).optional(),
  points: z.array(pointSchema).max(20000).optional(),
});

function serializeSession(row: any) {
  return {
    id: row.id,
    mode: row.mode,
    date: row.date,
    durationSec: row.duration_sec,
    distanceKm: row.distance_km,
    calories: row.calories,
    source: row.source,
    elevationGainM: row.elevation_gain_m,
  };
}

router.post('/', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  }
  const userId = userIdOf(req);
  const { mode, durationSec, points } = parsed.data;

  let distanceKm: number;
  let source: 'manual' | 'gps';
  let elevationGain: number | null = null;
  let cleaned: TrackPoint[] = [];
  let splits: { km: number; durationSec: number }[] = [];

  if (points && points.length >= 2) {
    cleaned = cleanTrack(points as TrackPoint[]);
    if (cleaned.length < 2) {
      return res.status(422).json({ error: 'GPS signal was too poor to measure this route.' });
    }
    distanceKm = Math.round((totalDistanceMeters(cleaned) / 1000) * 100) / 100;
    elevationGain = elevationGainMeters(cleaned);
    splits = kilometreSplits(cleaned);
    source = 'gps';
  } else {
    if (parsed.data.distanceKm == null) {
      return res.status(400).json({ error: 'Enter a distance, or record the route with GPS.' });
    }
    distanceKm = parsed.data.distanceKm;
    source = 'manual';
  }

  const calories = Math.round(distanceKm * (KCAL_PER_KM[mode] ?? 50));

  const insertSession = db.prepare(
    `INSERT INTO cardio_sessions (user_id, mode, date, duration_sec, distance_km, calories, source, elevation_gain_m)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertPoint = db.prepare(
    `INSERT INTO cardio_track_points (session_id, seq, lat, lon, altitude, accuracy, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertSplit = db.prepare('INSERT INTO cardio_splits (session_id, km, duration_sec) VALUES (?, ?, ?)');

  const tx = db.transaction(() => {
    const info = insertSession.run(userId, mode, todayStr(), durationSec, distanceKm, calories, source, elevationGain);
    const sessionId = Number(info.lastInsertRowid);
    cleaned.forEach((p, i) =>
      insertPoint.run(sessionId, i, p.lat, p.lon, p.altitude ?? null, p.accuracy ?? null, p.recordedAt)
    );
    splits.forEach((s) => insertSplit.run(sessionId, s.km, s.durationSec));
    return sessionId;
  });
  const id = tx();

  res.status(201).json({
    id,
    distanceKm,
    calories,
    source,
    elevationGainM: elevationGain,
    splits,
    pointsRecorded: cleaned.length,
    pointsDiscarded: points ? points.length - cleaned.length : 0,
  });
});

router.get('/history', (req, res) => {
  const userId = userIdOf(req);
  const rows = db.prepare('SELECT * FROM cardio_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(userId) as any[];
  res.json({ sessions: rows.map(serializeSession) });
});

router.get('/:id', (req, res) => {
  const userId = userIdOf(req);
  const row = db.prepare('SELECT * FROM cardio_sessions WHERE id = ? AND user_id = ?').get(Number(req.params.id), userId) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });

  const points = db
    .prepare('SELECT lat, lon, altitude, recorded_at FROM cardio_track_points WHERE session_id = ? ORDER BY seq ASC')
    .all(row.id) as any[];
  const splits = db
    .prepare('SELECT km, duration_sec FROM cardio_splits WHERE session_id = ? ORDER BY km ASC')
    .all(row.id) as any[];

  res.json({
    session: serializeSession(row),
    points: points.map((p) => ({ lat: p.lat, lon: p.lon, altitude: p.altitude, recordedAt: p.recorded_at })),
    splits: splits.map((s) => ({ km: s.km, durationSec: s.duration_sec })),
  });
});

export default router;
