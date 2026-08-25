import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button, Field, Input } from '../components/ui';
import './auth.css';
import './legal.css';

export default function SignUp() {
  const { user, loading, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Deliberately unticked by default — consent has to be an affirmative action.
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);

  const consentComplete = acceptTerms && acceptPrivacy && confirmAge;

  if (loading) return null;
  if (user) return <Navigate to={user.onboarded ? '/today' : '/onboarding'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consentComplete) {
      setError(t('legalConsentRequired'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signUp(email, password, name, {
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      navigate('/onboarding');
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
          {t('signUpTitle')}
        </h1>
        <p className="auth-sub">{t('signUpSub')}</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <Field label={t('nameLabel')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} autoComplete="name" />
          </Field>
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
          <Field label={t('passwordLabel')} error={error} hint={!error ? t('passwordHint') : undefined}>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <div className="consent-block">
            <p className="consent-read">
              {t('legalReadFirst')}{' '}
              <Link to="/terms" target="_blank" rel="noopener">
                {t('termsTitle')}
              </Link>
              {' · '}
              <Link to="/privacy" target="_blank" rel="noopener">
                {t('privacyTitle')}
              </Link>
            </p>
            <label className="consent-row">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
              <span>{t('legalAcceptTerms')}</span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} />
              <span>{t('legalAcceptPrivacy')}</span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={confirmAge} onChange={(e) => setConfirmAge(e.target.checked)} />
              <span>{t('legalConfirmAge')}</span>
            </label>
          </div>

          <Button type="submit" full disabled={busy || !consentComplete}>
            {busy ? t('creatingAccount') : t('createAccount')}
          </Button>
        </form>
        <p className="auth-foot">
          {t('alreadyHaveAccount')} <Link to="/sign-in">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
