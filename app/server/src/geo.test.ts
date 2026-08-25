import { describe, expect, it } from 'vitest';
import {
  cleanTrack,
  elevationGainMeters,
  haversineMeters,
  kilometreSplits,
  totalDistanceMeters,
  type TrackPoint,
} from './geo.js';

const at = (lat: number, lon: number, extra: Partial<TrackPoint> = {}): TrackPoint => ({
  lat,
  lon,
  recordedAt: '2026-01-01T00:00:00.000Z',
  ...extra,
});

/** A straight northward track at a constant speed. */
function straightTrack(opts: { metres: number; stepMetres: number; speedMps: number; startAlt?: number; climbFromIndex?: number; climbPerStep?: number }) {
  const degPerMetre = 1 / 111195;
  const stepSeconds = opts.stepMetres / opts.speedMps;
  const start = Date.parse('2026-01-01T06:00:00.000Z');
  const points: TrackPoint[] = [];
  for (let i = 0; i * opts.stepMetres <= opts.metres; i++) {
    const climbing = opts.climbFromIndex != null && i > opts.climbFromIndex;
    points.push({
      lat: 55.75 + i * opts.stepMetres * degPerMetre,
      lon: 37.62,
      altitude:
        opts.startAlt == null
          ? null
          : opts.startAlt + (climbing ? (i - opts.climbFromIndex!) * (opts.climbPerStep ?? 0) : 0),
      accuracy: 8,
      recordedAt: new Date(start + i * stepSeconds * 1000).toISOString(),
    });
  }
  return points;
}

describe('haversineMeters', () => {
  it('matches an independently computed great-circle distance', () => {
    // Greenwich Observatory -> Notre-Dame, verified against a separate implementation.
    const d = haversineMeters(at(51.4769, -0.0005), at(48.853, 2.3499));
    expect(Math.round(d)).toBe(336343);
  });

  it('measures one degree of latitude as ~111.2 km', () => {
    expect(Math.round(haversineMeters(at(0, 0), at(1, 0)))).toBe(111195);
  });

  it('returns zero for identical points', () => {
    expect(haversineMeters(at(55.75, 37.62), at(55.75, 37.62))).toBe(0);
  });
});

describe('cleanTrack', () => {
  it('keeps every point of a clean track', () => {
    const track = straightTrack({ metres: 300, stepMetres: 9, speedMps: 3 });
    expect(cleanTrack(track)).toHaveLength(track.length);
  });

  it('drops points with poor reported accuracy', () => {
    const track = [
      at(55.75, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:00.000Z' }),
      at(55.7501, 37.62, { accuracy: 500, recordedAt: '2026-01-01T06:00:03.000Z' }),
      at(55.7502, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:06.000Z' }),
    ];
    expect(cleanTrack(track)).toHaveLength(2);
  });

  it('drops physically impossible jumps', () => {
    const track = [
      at(55.75, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:00.000Z' }),
      at(56.9, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:03.000Z' }), // ~128 km in 3 s
      at(55.7502, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:06.000Z' }),
    ];
    const cleaned = cleanTrack(track);
    expect(cleaned).toHaveLength(2);
    expect(Math.round(totalDistanceMeters(cleaned))).toBeLessThan(50);
  });

  it('ignores points with a non-advancing timestamp', () => {
    const track = [
      at(55.75, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:00.000Z' }),
      at(55.7501, 37.62, { accuracy: 5, recordedAt: '2026-01-01T06:00:00.000Z' }),
    ];
    expect(cleanTrack(track)).toHaveLength(1);
  });

  it('returns an empty array when every point is inaccurate', () => {
    const track = [at(55.75, 37.62, { accuracy: 900 }), at(55.76, 37.62, { accuracy: 900 })];
    expect(cleanTrack(track)).toEqual([]);
  });

  it('handles an empty input', () => {
    expect(cleanTrack([])).toEqual([]);
  });
});

describe('totalDistanceMeters', () => {
  it('measures a synthetic 3 km track', () => {
    const track = straightTrack({ metres: 3000, stepMetres: 9, speedMps: 3 });
    expect(Math.round(totalDistanceMeters(track))).toBeCloseTo(2997, -1);
  });

  it('is zero for fewer than two points', () => {
    expect(totalDistanceMeters([])).toBe(0);
    expect(totalDistanceMeters([at(55.75, 37.62)])).toBe(0);
  });
});

describe('kilometreSplits', () => {
  it('emits one split per completed kilometre with the right pace', () => {
    // 3 m/s => 1000 m takes ~333 s.
    const track = straightTrack({ metres: 3000, stepMetres: 9, speedMps: 3 });
    const splits = kilometreSplits(track);
    expect(splits).toHaveLength(2); // the track is 2997 m, so 3 km is never reached
    expect(splits[0].km).toBe(1);
    expect(splits[0].durationSec).toBeCloseTo(333, -1);
    expect(splits[1].durationSec).toBeCloseTo(333, -1);
  });

  it('emits no splits for a route under one kilometre', () => {
    const track = straightTrack({ metres: 500, stepMetres: 5, speedMps: 3 });
    expect(kilometreSplits(track)).toEqual([]);
  });

  it('handles empty and single-point input', () => {
    expect(kilometreSplits([])).toEqual([]);
    expect(kilometreSplits([at(55.75, 37.62)])).toEqual([]);
  });
});

describe('elevationGainMeters', () => {
  it('sums sustained climbs and ignores the descent', () => {
    const track = straightTrack({
      metres: 3000,
      stepMetres: 9,
      speedMps: 3,
      startAlt: 150,
      climbFromIndex: 200,
      climbPerStep: 0.1,
    });
    // ~133 points climbing 0.1 m each ≈ 13 m.
    expect(elevationGainMeters(track)).toBeGreaterThan(8);
    expect(elevationGainMeters(track)).toBeLessThan(18);
  });

  it('ignores altitude noise below the rise threshold', () => {
    const jitter = [150, 151, 150, 151.5, 149.5, 150.5].map((altitude, i) =>
      at(55.75 + i * 0.0001, 37.62, { altitude, accuracy: 5, recordedAt: new Date(Date.parse('2026-01-01T06:00:00.000Z') + i * 3000).toISOString() })
    );
    expect(elevationGainMeters(jitter)).toBe(0);
  });

  it('is zero when no altitude data is present', () => {
    expect(elevationGainMeters(straightTrack({ metres: 100, stepMetres: 10, speedMps: 3 }))).toBe(0);
  });

  it('handles empty input', () => {
    expect(elevationGainMeters([])).toBe(0);
  });
});
