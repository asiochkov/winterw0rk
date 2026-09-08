import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiError } from '../api/client';

/**
 * Only a message the server actually sent is worth showing. A failed fetch
 * throws the browser's own Error — "Failed to fetch", "NetworkError when
 * attempting to fetch resource" — which is English whatever the interface
 * language is, and means nothing to the person reading it. Everything that is
 * not an ApiError falls back to the translated line.
 */
function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (value: T) => void;
}

/**
 * Loads data with explicit loading and error states so a failed request shows a
 * retry instead of an empty screen that looks like "you have no data".
 */
export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRef = useRef(load);
  loadRef.current = load;
  // Ignore a resolved response from a request that a newer one has superseded.
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  // Held in a ref so `run` stays stable while still reading the current language.
  const { t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setData(result);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(messageOf(err, tRef.current('genericError')));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: run, setData };
}

/**
 * Tracks a one-off mutation (save, complete, delete) so buttons can disable
 * while in flight and surface a failure rather than appearing to succeed.
 *
 * Failures are flashed as well as returned. Returning `error` alone was not
 * enough in practice: most callers never rendered it, so a failed request left
 * the screen unchanged and the user with no idea whether the tap registered.
 * A caller that shows the error inline can pass `silent` to keep the toast out
 * of the way.
 *
 * `run` also refuses to start while one is already in flight, which is what
 * stops a double tap from logging the same set or habit twice.
 */
export function useMutation() {
  const { flash } = useToast();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(
    async (action: () => Promise<unknown>, opts: { success?: string; silent?: boolean } = {}) => {
      if (inFlight.current) return false;
      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        await action();
        if (opts.success) flash(opts.success);
        return true;
      } catch (err) {
        const message = messageOf(err, t('saveFailed'));
        setError(message);
        if (!opts.silent) flash(message, 'error');
        return false;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [flash]
  );

  return { busy, error, run, clearError: () => setError(null) };
}
