import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * The one way back out of a nested screen.
 *
 * `navigate(-1)` alone is the nicest behaviour — it returns the user wherever
 * they actually came from — but it is wrong on a cold entry: a shared link, a
 * refresh, or a legal page opened with `target="_blank"` all start a fresh
 * history stack, and stepping back there leaves the app entirely. React Router
 * stamps its own index onto `history.state`, so we can tell the two apart and
 * fall back to the screen the user would have come from.
 */
export function useBack(fallback: string) {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === 'number' && idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
