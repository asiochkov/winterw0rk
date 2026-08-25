import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui';
import './auth.css';
import './legal.css';

export default function Welcome() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (loading) return null;
  if (user) return <Navigate to={user.onboarded ? '/today' : '/onboarding'} replace />;

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-mark">WW</div>
        <p className="auth-kicker">{t('welcomeKicker')}</p>
        <h1 className="auth-headline">{t('welcomeHeadline')}</h1>
        <p className="auth-sub">{t('welcomeSub')}</p>
      </div>
      <div className="auth-actions">
        <Button full onClick={() => navigate('/sign-up')}>
          {t('createAccount')}
        </Button>
        <Button full variant="secondary" onClick={() => navigate('/sign-in')}>
          {t('signIn')}
        </Button>
        <div className="legal-links">
          <Link to="/terms">{t('termsTitle')}</Link>
          <Link to="/privacy">{t('privacyTitle')}</Link>
        </div>
      </div>
    </div>
  );
}
