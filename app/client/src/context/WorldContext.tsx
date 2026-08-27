import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * The prototype's two worlds. `disc` (discipline) and `fit` (fitness) are not
 * a theme or a filter — they swap the whole bottom navigation and reorder the
 * Today screen, so the choice has to live above the router.
 *
 * v6 defines them as ДИСЦИПЛИНА / ФИТНЕС with an ice dot and an amber dot.
 */
export type World = 'disc' | 'fit';

const STORAGE_KEY = 'ww_world';

interface WorldState {
  world: World;
  setWorld: (w: World) => void;
  isFit: boolean;
}

const WorldContext = createContext<WorldState | null>(null);

function readInitial(): World {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'fit' ? 'fit' : 'disc';
  } catch {
    // Private windows and blocked site data both throw here.
    return 'disc';
  }
}

export function WorldProvider({ children }: { children: ReactNode }) {
  const [world, setWorldState] = useState<World>(readInitial);

  const setWorld = useCallback((w: World) => {
    setWorldState(w);
    try {
      localStorage.setItem(STORAGE_KEY, w);
    } catch {
      /* not worth failing the switch over */
    }
  }, []);

  const value = useMemo(() => ({ world, setWorld, isFit: world === 'fit' }), [world, setWorld]);
  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld(): WorldState {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error('useWorld must be used inside WorldProvider');
  return ctx;
}
