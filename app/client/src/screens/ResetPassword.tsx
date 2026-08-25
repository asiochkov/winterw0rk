import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Button, Field, Input } from '../components/ui';
import './auth.css';

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(token ? '' : t('resetPasswordInvalidToken'));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-wrap">
        <h1 className="auth-headline" style={{ fontSize: 26 }}>
          {t('resetPasswordTitle')}
        </h1>
        <p className="auth-sub">{t('resetPasswordSub')}</p>

        {done ? (
          <div className="form-stack" style={{ marginTop: 32 }}>
            <p className="today-mood-set">{t('resetPasswordSuccess')}</p>
            <Button full onClick={() => navigate('/sign-in')}>
              {t('signIn')}
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <Field label={t('passwordLabel')} error={error} hint={!error ? t('passwordHint') : undefined}>
              <Input
                type="password"
                required
                minLength={8}
                disabled={!token}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" full disabled={busy || !token}>
              {busy ? t('forgotPasswordSending') : t('resetPasswordBtn')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
