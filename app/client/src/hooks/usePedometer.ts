import { useCallback, useEffect, useRef, useState } from 'react';

export type PedometerStatus = 'idle' | 'requesting' | 'counting' | 'denied' | 'unsupported';

/**
 * Peak-detection step counting from the device accelerometer.
 *
 * Walking shows up as a roughly 1.5–2.5 Hz oscillation in total acceleration.
 * We low-pass the signal to kill sensor noise, then count a step each time the
 * smoothed magnitude crosses a threshold upward, with a refractory period so a
 * single stride cannot register twice.
 *
 * Raw sensor values never leave the device — only the resulting count is synced.
 */

/** Ignore anything faster than ~3.3 steps/sec; that is shaking, not walking. */
const MIN_STEP_INTERVAL_MS = 300;
/** Metres per second squared above resting gravity that counts as a footfall. */
const PEAK_THRESHOLD = 1.2;
/** 0–1: higher reacts faster but admits more noise. */
const SMOOTHING = 0.3;

interface DeviceMotionEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function usePedometer(onStep?: (total: number) => void) {
  const [status, setStatus] = useState<PedometerStatus>('idle');
  const [sessionSteps, setSessionSteps] = useState(0);

  const smoothedRef = useRef(9.81);
  const aboveThresholdRef = useRef(false);
  const lastStepAtRef = useRef(0);
  const stepsRef = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    smoothedRef.current = smoothedRef.current * (1 - SMOOTHING) + magnitude * SMOOTHING;

    // Compare against gravity so orientation does not matter.
    const delta = Math.abs(smoothedRef.current - 9.81);
    const now = Date.now();

    if (delta > PEAK_THRESHOLD && !aboveThresholdRef.current) {
      aboveThresholdRef.current = true;
      if (now - lastStepAtRef.current >= MIN_STEP_INTERVAL_MS) {
        lastStepAtRef.current = now;
        stepsRef.current += 1;
        setSessionSteps(stepsRef.current);
        onStepRef.current?.(stepsRef.current);
      }
    } else if (delta < PEAK_THRESHOLD * 0.6) {
      // Hysteresis: require a clear drop before arming the next peak.
      aboveThresholdRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setStatus((s) => (s === 'counting' || s === 'requesting' ? 'idle' : s));
  }, [handleMotion]);

  const start = useCallback(async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');

    // iOS 13+ requires an explicit permission prompt from a user gesture.
    const maybePermission = DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
    if (typeof maybePermission.requestPermission === 'function') {
      try {
        const result = await maybePermission.requestPermission();
        if (result !== 'granted') {
          setStatus('denied');
          return;
        }
      } catch {
        setStatus('denied');
        return;
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    setStatus('counting');
  }, [handleMotion]);

  const resetSession = useCallback(() => {
    stepsRef.current = 0;
    setSessionSteps(0);
  }, []);

  useEffect(() => {
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion]);

  return { status, sessionSteps, start, stop, resetSession };
}
