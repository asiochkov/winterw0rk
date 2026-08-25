import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { User } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui';
import '../screens/legal.css';
import '../screens/auth.css';

/**
 * Blocks the app when the legal documents have changed since the user last
 * accepted them. The server decides this (`needsConsent`), not the client.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user?.needsConsent) return <>{children}</>;

  async function accept() {
    setBusy(true);
    try {
      const { user: updated } = await api.post<{ user: User }>('/auth/consent', {
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
      setUser(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-wrap">
        <h1 className="auth-headline" style={{ fontSize: 24 }}>
          {t('legalUpdatedTitle')}
        </h1>
        <p className="auth-sub">{t('legalUpdatedBody')}</p>

        <div className="consent-block" style={{ marginTop: 28 }}>
          <p className="consent-read">
            <Link to="/terms" target="_blank" rel="noopener">
              {t('termsTitle')}
            </Link>
            {' · '}
            <Link to="/privacy" target="_blank" rel="noopener">
              {t('privacyTitle')}
            </Link>
          </p>
          <label className="consent-row">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>{t('legalAcceptTerms')}</span>
          </label>
          <label className="consent-row">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
            <span>{t('legalAcceptPrivacy')}</span>
          </label>
        </div>

        <Button full disabled={!terms || !privacy || busy} onClick={accept} style={{ marginTop: 20 }}>
          {t('legalAcceptAndContinue')}
        </Button>
      </div>
    </div>
  );
}
