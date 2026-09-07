import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsentGate } from './ConsentGate';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, sessionExpired } = useAuth();
  if (loading) return null;
  // An expired session lands on sign-in, which says so; someone who was never
  // signed in lands on the welcome screen.
  if (!user) return <Navigate to={sessionExpired ? '/sign-in' : '/'} replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <ConsentGate>{children}</ConsentGate>;
}
