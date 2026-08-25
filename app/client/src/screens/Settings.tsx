import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, Section } from '../components/ui';
import './legal.css';

interface Billing {
  plan: 'free' | 'plus';
  features: string[];
  checkoutAvailable: boolean;
}

interface Notifications {
  reminderEmailEnabled: boolean;
  reminderHour: number;
  timezone: string | null;
}

/** The zone this browser reports, or undefined where Intl is unavailable. */
function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notif, setNotif] = useState<Notifications | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    api.get<Billing>('/billing/me').then(setBilling).catch(() => setBilling(null));
    api.get<Notifications>('/account/notifications').then(setNotif).catch(() => setNotif(null));
  }, []);

  async function updateNotifications(patch: Partial<Notifications>) {
    setSavingNotif(true);
    try {
      setNotif(await api.patch<Notifications>('/account/notifications', patch));
    } finally {
      setSavingNotif(false);
    }
  }

  async function logout() {
    await signOut();
    navigate('/');
  }

  async function deleteAccount() {
    await api.delete('/auth/me');
    window.location.href = '/';
  }

  /**
   * Fetched rather than linked directly so the browser sends the session cookie
   * and any failure surfaces instead of opening a broken tab.
   */
  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export', { credentials: 'include' });
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winterwork-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen title={t('settingsTitle')} nav={false}>
      <Section title={t('settingsAccount')}>
        <p style={{ fontSize: 14, color: 'var(--mut)' }}>{user?.email}</p>
      </Section>

      <Section title={t('planTitle')}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>
          {billing?.plan === 'plus' ? t('planPlus') : t('planFree')}
        </p>
        <p style={{ fontSize: 13, color: 'var(--mut)', margin: '0 0 8px' }}>{t('planCurrentFree')}</p>
        <p style={{ fontSize: 12.5, color: 'var(--mut-dim)', margin: 0 }}>{t('planFutureNote')}</p>
      </Section>

      <Section title={t('settingsLanguage')}>
        <div className="type-row">
          <button className={`type-btn ${lang === 'en' ? 'type-btn-on' : ''}`} onClick={() => setLang('en')}>
            English
          </button>
          <button className={`type-btn ${lang === 'ru' ? 'type-btn-on' : ''}`} onClick={() => setLang('ru')}>
            Русский
          </button>
        </div>
      </Section>

      <Section title={t('legalYourData')}>
        <Button full variant="secondary" onClick={exportData} disabled={exporting}>
          {exporting ? t('forgotPasswordSending') : t('legalExportData')}
        </Button>
        <p style={{ fontSize: 12.5, color: 'var(--mut)', marginTop: 10 }}>{t('legalExportNote')}</p>
        <div className="legal-links" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
          <Link to="/terms">{t('termsTitle')}</Link>
          <Link to="/privacy">{t('privacyTitle')}</Link>
        </div>
      </Section>

      {user?.isAdmin && (
        <Section title="Admin">
          <Button full variant="secondary" onClick={() => navigate('/admin')}>
            Manage accounts
          </Button>
        </Section>
      )}

      <Section title={t('settingsNotifications')}>
        {notif ? (
          <>
            <label className="consent-row" style={{ marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={notif.reminderEmailEnabled}
                disabled={savingNotif}
                onChange={(e) => updateNotifications({ reminderEmailEnabled: e.target.checked })}
              />
              <span>{t('notifDailyReminder')}</span>
            </label>
            {notif.reminderEmailEnabled && (
              <label className="field" style={{ maxWidth: 200 }}>
                <span className="field-label">{t('notifReminderTime')}</span>
                <select
                  className="input"
                  value={notif.reminderHour}
                  disabled={savingNotif}
                  onChange={(e) => updateNotifications({ reminderHour: Number(e.target.value) })}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
            )}
            {notif.reminderEmailEnabled && (
              <p style={{ fontSize: 12.5, color: 'var(--mut)', marginTop: 8 }}>
                {t('notifTimezone', { tz: notif.timezone || t('notifTimezoneUnknown') })}{' '}
                <button className="today-link" onClick={() => updateNotifications({ timezone: browserTimezone() })}>
                  {t('notifTimezoneUse')}
                </button>
              </p>
            )}
            <p style={{ fontSize: 12.5, color: 'var(--mut)', marginTop: 10 }}>{t('notifReminderNote')}</p>
          </>
        ) : (
          <p style={{ fontSize: 13.5, color: 'var(--mut)' }}>{t('settingsNotificationsBody')}</p>
        )}
      </Section>

      <Section>
        <Button full variant="secondary" onClick={logout}>
          {t('settingsSignOut')}
        </Button>
      </Section>

      <Section title={t('settingsDangerZone')}>
        {!confirmDelete ? (
          <>
            <button className="today-link" onClick={() => setConfirmDelete(true)}>
              {t('settingsDeleteAccount')}
            </button>
            <p style={{ fontSize: 12.5, color: 'var(--mut)', marginTop: 8 }}>{t('legalDeleteNote')}</p>
          </>
        ) : (
          <div className="form-stack">
            <p className="today-empty">{t('settingsDeleteConfirm')}</p>
            <Button full variant="danger" onClick={deleteAccount}>
              {t('settingsDeleteConfirmBtn')}
            </Button>
            <Button full variant="ghost" onClick={() => setConfirmDelete(false)}>
              {t('cancel')}
            </Button>
          </div>
        )}
      </Section>
    </Screen>
  );
}
