import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import './toast.css';

type Tone = 'info' | 'error';

interface ToastState {
  message: string;
  tone: Tone;
  /** Bumped on every flash so the same message twice still re-announces. */
  seq: number;
}

interface ToastApi {
  /** v7 calls this flash(); it shows a line for 1.9s and gets out of the way. */
  flash: (message: string, tone?: Tone) => void;
}

const Ctx = createContext<ToastApi | null>(null);

/** v7 holds a toast for 1900ms. */
const DISMISS_MS = 1900;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((message: string, tone: Tone = 'info') => {
    setToast((prev) => ({ message, tone, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), DISMISS_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  const value = useMemo(() => ({ flash }), [flash]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {/*
        Errors are assertive so a failed action interrupts; a confirmation is
        polite so it does not talk over what the user is doing.
      */}
      <div
        className="ww-toast-slot"
        role="status"
        aria-live={toast?.tone === 'error' ? 'assertive' : 'polite'}
      >
        {toast && (
          <div key={toast.seq} className={`ww-toast ${toast.tone === 'error' ? 'is-error' : ''}`}>
            {toast.message}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
