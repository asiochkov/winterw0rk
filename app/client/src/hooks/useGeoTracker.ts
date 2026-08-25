import { useCallback, useEffect, useRef, useState } from 'react';

export interface GeoPoint {
  lat: number;
  lon: number;
  altitude: number | null;
  accuracy: number | null;
  recordedAt: string;
}

export type GeoStatus =
  | 'idle'
  | 'requesting'
  /** Receiving fixes normally. */
  | 'tracking'
  /** Had a fix, signal dropped out — the watch is still alive and will recover. */
  | 'signal-lost'
  /** Permission refused. Terminal: the watch is stopped. */
  | 'denied'
  /** Never got a single fix (no hardware, or blocked the whole time). */
  | 'unavailable';

const EARTH_RADIUS_M = 6371000;

function haversine(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Live position tracking via the browser Geolocation API. Distance shown while
 * running is a client-side estimate for feedback; the server recomputes it from
 * the raw points on save so the stored value can't be spoofed or drift.
 */
export function useGeoTracker() {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [liveDistanceM, setLiveDistanceM] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastAcceptedRef = useRef<GeoPoint | null>(null);
  const hadFixRef = useRef(false);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus((s) => (s === 'tracking' || s === 'requesting' || s === 'signal-lost' ? 'idle' : s));
  }, []);

  const reset = useCallback(() => {
    setPoints([]);
    setLiveDistanceM(0);
    setAccuracy(null);
    lastAcceptedRef.current = null;
    hadFixRef.current = false;
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    reset();
    setStatus('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          altitude: pos.coords.altitude ?? null,
          accuracy: pos.coords.accuracy ?? null,
          recordedAt: new Date(pos.timestamp).toISOString(),
        };
        hadFixRef.current = true;
        setStatus('tracking');
        setAccuracy(point.accuracy);

        // Mirror the server's filters so the live readout matches the saved result.
        if (point.accuracy != null && point.accuracy > 50) return;
        const last = lastAcceptedRef.current;
        if (last) {
          const seconds = (Date.parse(point.recordedAt) - Date.parse(last.recordedAt)) / 1000;
          if (seconds <= 0) return;
          const metres = haversine(last, point);
          if (metres / seconds > 12) return;
          setLiveDistanceM((d) => d + metres);
        }
        lastAcceptedRef.current = point;
        setPoints((p) => [...p, point]);
      },
      (err) => {
        // Only a permission refusal is terminal. POSITION_UNAVAILABLE and TIMEOUT
        // fire routinely mid-run (tunnels, urban canyons, a dropped satellite lock)
        // and recover on their own — tearing down the watch there would silently
        // end the recording for the rest of the session.
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          return;
        }
        setStatus(hadFixRef.current ? 'signal-lost' : 'unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  }, [reset]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return { status, points, liveDistanceM, accuracy, start, stop, reset };
}
