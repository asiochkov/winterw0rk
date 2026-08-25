import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui';
import '../screens/legal.css';

const STORAGE_KEY = 'ww-cookie-notice-ack';

function alreadyAcknowledged(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Disclosure, not a consent gate. The only cookie set is the strictly necessary
 * session cookie, which does not require opt-in — so this informs rather than
 * blocking the page behind an accept button.
 */
export function CookieNotice() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(alreadyAcknowledged);

  // The notice is fixed to the bottom, which is exactly where primary actions
  // sit on mobile. Reserve space for it so it never covers a button the user
  // needs to press.
  useEffect(() => {
    const cls = 'has-cookie-notice';
    document.body.classList.toggle(cls, !dismissed);
    return () => document.body.classList.remove(cls);
  }, [dismissed]);

  if (dismissed) return null;

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Private browsing can refuse writes; dismissing for this session is enough.
    }
    setDismissed(true);
  }

  return (
    <div className="cookie-notice" role="note">
      <p>
        {t('cookieNoticeText')} <Link to="/privacy">{t('cookieNoticeLink')}</Link>
      </p>
      <Button variant="secondary" onClick={acknowledge}>
        {t('cookieNoticeAccept')}
      </Button>
    </div>
  );
}
