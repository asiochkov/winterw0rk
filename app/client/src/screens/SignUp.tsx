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
  const [showPassword, setShowPassword] = useState(false);
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
        <h1 className="auth-headline auth-headline-form">{t('signUpTitle')}</h1>
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
          <Field label={t('passwordLabel')} hint={t('passwordHint')}>
            <div className="auth-password">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {/* A typo in a masked field can otherwise only be found by failing. */}
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {t(showPassword ? 'passwordHide' : 'passwordShow')}
              </button>
            </div>
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
              <span className="consent-box" aria-hidden="true">✓</span>
              <span>{t('legalAcceptTerms')}</span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} />
              <span className="consent-box" aria-hidden="true">✓</span>
              <span>{t('legalAcceptPrivacy')}</span>
            </label>
            <label className="consent-row">
              <input type="checkbox" checked={confirmAge} onChange={(e) => setConfirmAge(e.target.checked)} />
              <span className="consent-box" aria-hidden="true">✓</span>
              <span>{t('legalConfirmAge')}</span>
            </label>
          </div>

          {/* The error sits with the action it belongs to, not under the
              password field where a "that email is taken" made no sense. */}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}

          {/* The button stays enabled while consent is outstanding. Disabling
              it left the screen looking broken on arrival with nothing saying
              why; submitting now says exactly what is missing. */}
          <Button type="submit" full disabled={busy}>
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
