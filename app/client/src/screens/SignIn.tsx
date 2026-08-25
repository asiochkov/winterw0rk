import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button, Field, Input } from '../components/ui';
import './auth.css';

export default function SignIn() {
  const { user, loading, signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to={user.onboarded ? '/today' : '/onboarding'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await signIn(email, password);
      navigate(user.onboarded ? '/today' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-wrap">
        <button className="auth-back" onClick={() => navigate('/')}>
          ← {t('back')}
        </button>
        <h1 className="auth-headline" style={{ fontSize: 26, marginTop: 24 }}>
          {t('signInTitle')}
        </h1>
        <p className="auth-sub">{t('signInSub')}</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <Field label={t('emailLabel')}>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label={t('passwordLabel')} error={error}>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Link to="/forgot-password" style={{ fontSize: 13.5, alignSelf: 'flex-start' }}>
            {t('forgotPassword')}
          </Link>
          <Button type="submit" full disabled={busy}>
            {busy ? t('signingIn') : t('signIn')}
          </Button>
        </form>
        <p className="auth-foot">
          {t('newHere')} <Link to="/sign-up">{t('createAnAccount')}</Link>
        </p>
      </div>
    </div>
  );
}
