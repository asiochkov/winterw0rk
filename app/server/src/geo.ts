export interface TrackPoint {
  lat: number;
  lon: number;
  altitude?: number | null;
  accuracy?: number | null;
  recordedAt: string;
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Drops points whose reported accuracy is worse than the threshold, and points
 * implying a jump faster than a human can move — consumer GPS regularly emits
 * both, and either one inflates distance badly if taken at face value.
 */
export function cleanTrack(points: TrackPoint[], maxAccuracyM = 50, maxSpeedMps = 12): TrackPoint[] {
  const usable = points.filter((p) => p.accuracy == null || p.accuracy <= maxAccuracyM);
  if (usable.length === 0) return [];

  const cleaned: TrackPoint[] = [usable[0]];
  for (let i = 1; i < usable.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = usable[i];
    const seconds = (new Date(curr.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / 1000;
    if (seconds <= 0) continue;
    const speed = haversineMeters(prev, curr) / seconds;
    if (speed > maxSpeedMps) continue;
    cleaned.push(curr);
  }
  return cleaned;
}

export function totalDistanceMeters(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

/** Only counts climbs above the noise floor — GPS altitude drifts several metres at rest. */
export function elevationGainMeters(points: TrackPoint[], minRiseM = 3): number {
  let gain = 0;
  let reference: number | null = null;
  for (const p of points) {
    if (p.altitude == null) continue;
    if (reference == null) {
      reference = p.altitude;
      continue;
    }
    const delta = p.altitude - reference;
    if (delta >= minRiseM) {
      gain += delta;
      reference = p.altitude;
    } else if (delta < 0) {
      reference = p.altitude;
    }
  }
  return Math.round(gain);
}

/** Cumulative seconds at each whole kilometre, interpolated between the two bracketing points. */
export function kilometreSplits(points: TrackPoint[]): { km: number; durationSec: number }[] {
  const splits: { km: number; durationSec: number }[] = [];
  if (points.length < 2) return splits;

  const startMs = new Date(points[0].recordedAt).getTime();
  let cumulative = 0;
  let nextKm = 1;
  let previousSplitSec = 0;

  for (let i = 1; i < points.length; i++) {
    const segment = haversineMeters(points[i - 1], points[i]);
    if (segment <= 0) continue;

    while (cumulative + segment >= nextKm * 1000) {
      const fraction = (nextKm * 1000 - cumulative) / segment;
      const tPrev = new Date(points[i - 1].recordedAt).getTime();
      const tCurr = new Date(points[i].recordedAt).getTime();
      const crossingMs = tPrev + (tCurr - tPrev) * fraction;
      const elapsedSec = Math.round((crossingMs - startMs) / 1000);
      splits.push({ km: nextKm, durationSec: elapsedSec - previousSplitSec });
      previousSplitSec = elapsedSec;
      nextKm++;
    }
    cumulative += segment;
  }
  return splits;
}
