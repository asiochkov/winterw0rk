import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Button, Field, Input } from '../components/ui';
import './auth.css';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api.post<{ ok: boolean; devResetToken?: string }>('/auth/forgot-password', { email });
      setSent(true);
      setDevToken(r.devResetToken ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-wrap">
        <button className="auth-back" onClick={() => navigate('/sign-in')}>
          ← {t('back')}
        </button>
        <h1 className="auth-headline" style={{ fontSize: 26, marginTop: 24 }}>
          {t('forgotPasswordTitle')}
        </h1>
        <p className="auth-sub">{t('forgotPasswordSub')}</p>

        {sent ? (
          <div className="form-stack" style={{ marginTop: 32 }}>
            <p className="today-mood-set">{t('forgotPasswordSent')}</p>
            {devToken && (
              <div className="banner banner-am">
                <p style={{ margin: '0 0 8px' }}>{t('forgotPasswordDevNote')}</p>
                <Link to={`/reset-password?token=${devToken}`}>/reset-password?token={devToken}</Link>
              </div>
            )}
            <Link to="/sign-in" className="auth-foot" style={{ display: 'block' }}>
              {t('backToSignIn')}
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <Field label={t('emailLabel')} error={error}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Button type="submit" full disabled={busy}>
              {busy ? t('forgotPasswordSending') : t('forgotPasswordSend')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
