import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';

export interface SignupConsent {
  acceptedTerms: true;
  acceptedPrivacy: true;
  confirmedAge: true;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, consent: SignupConsent) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const signUp = useCallback(
    async (email: string, password: string, name: string, consent: SignupConsent) => {
      // Captured here so a reminder set for 19:00 means 19:00 where they are.
      // Changeable later in Settings; the server ignores anything it can't resolve.
      let timezone: string | undefined;
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        /* leave unset — the server falls back to its own clock */
      }
      const { user } = await api.post<{ user: User }>('/auth/signup', {
        email,
        password,
        name,
        timezone,
        ...consent,
      });
      setUser(user);
      return user;
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await api.post<{ user: User }>('/auth/login', { email, password });
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
