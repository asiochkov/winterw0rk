import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { WorldProvider } from './context/WorldContext';
import { RequireAuth } from './components/Guards';
import Welcome from './screens/Welcome';
import SignIn from './screens/SignIn';
import SignUp from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import HabitsList from './screens/habits/HabitsList';
import AddHabit from './screens/habits/AddHabit';
import HabitDetail from './screens/habits/HabitDetail';
import QuitList from './screens/quit/QuitList';
import AddQuit from './screens/quit/AddQuit';
import QuitDetail from './screens/quit/QuitDetail';
import Training from './screens/training/Training';
import ActiveSession from './screens/training/ActiveSession';
import SessionSummary from './screens/training/SessionSummary';
import ExerciseLibrary from './screens/training/ExerciseLibrary';
import ExerciseDetail from './screens/training/ExerciseDetail';
import Mood from './screens/Mood';
import Focus from './screens/Focus';
import FocusHistory from './screens/FocusHistory';
import { ProgramsList, ProgramDetail } from './screens/Programs';
import Body from './screens/Body';
import Nutrition from './screens/Nutrition';
import Street from './screens/Street';
import Planner from './screens/Planner';
import Progress from './screens/Progress';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import More from './screens/More';
import Steps from './screens/Steps';
import { Terms, Privacy } from './screens/LegalPage';
import { CookieNotice } from './components/CookieNotice';
import Admin from './screens/Admin';
import { ErrorBoundary } from './components/states';

function P({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
        <WorldProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/today" element={<P><Today /></P>} />
              <Route path="/more" element={<P><More /></P>} />

              <Route path="/habits" element={<P><HabitsList /></P>} />
              <Route path="/habits/new" element={<P><AddHabit /></P>} />
              <Route path="/habits/:id" element={<P><HabitDetail /></P>} />

              <Route path="/quit" element={<P><QuitList /></P>} />
              <Route path="/quit/new" element={<P><AddQuit /></P>} />
              <Route path="/quit/:id" element={<P><QuitDetail /></P>} />

              <Route path="/training" element={<P><Training /></P>} />
              <Route path="/training/library" element={<P><ExerciseLibrary /></P>} />
              <Route path="/training/exercises/:id" element={<P><ExerciseDetail /></P>} />
              <Route path="/training/session/:id" element={<P><ActiveSession /></P>} />
              <Route path="/training/session/:id/summary" element={<P><SessionSummary /></P>} />

              <Route path="/mood" element={<P><Mood /></P>} />
              <Route path="/focus" element={<P><Focus /></P>} />
              <Route path="/focus/history" element={<P><FocusHistory /></P>} />

              <Route path="/programs" element={<P><ProgramsList /></P>} />
              <Route path="/programs/:id" element={<P><ProgramDetail /></P>} />

              <Route path="/body" element={<P><Body /></P>} />
              <Route path="/nutrition" element={<P><Nutrition /></P>} />
              <Route path="/street" element={<P><Street /></P>} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/planner" element={<P><Planner /></P>} />
              <Route path="/steps" element={<P><Steps /></P>} />

              <Route path="/profile" element={<P><Profile /></P>} />
              <Route path="/settings" element={<P><Settings /></P>} />
              <Route path="/admin" element={<P><Admin /></P>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <CookieNotice />
          </ErrorBoundary>
        </AuthProvider>
        </WorldProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
