import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useServerConfig } from '../hooks/useServerConfig';
import { useBack } from '../hooks/useBack';
import { Screen } from '../components/Shell';
import { Button, Section } from '../components/ui';
import { CURRENCIES } from '../lib/currencies';
import './legal.css';
import './settings.css';

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
  const { user, signOut, setUser } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { reminderEmailsEnabled } = useServerConfig();
  const navigate = useNavigate();
  const back = useBack('/more');
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

  async function changeCurrency(currency: string) {
    const { currency: saved } = await api.patch<{ currency: string }>('/account/currency', { currency });
    if (user) setUser({ ...user, currency: saved });
  }

  return (
    <Screen title={t('settingsTitle')} nav={false} back={back}>
      <Section title={t('settingsAccount')}>
        <p className="set-value">{user?.email}</p>
      </Section>

      <Section title={t('planTitle')}>
        <p className="set-plan-name">
          {billing?.plan === 'plus' ? t('planPlus') : t('planFree')}
        </p>
        <p className="set-note">{t('planCurrentFree')}</p>
        <p className="set-note-quiet">{t('planFutureNote')}</p>
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

      <Section title={t('settingsCurrency')}>
        <p className="set-note">{t('settingsCurrencyNote')}</p>
        <select
          className="ww-select"
          value={user?.currency ?? 'USD'}
          onChange={(e) => changeCurrency(e.target.value)}
          aria-label={t('settingsCurrency')}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Section>

      <Section title={t('legalYourData')}>
        <Button full variant="secondary" onClick={exportData} disabled={exporting}>
          {exporting ? t('forgotPasswordSending') : t('legalExportData')}
        </Button>
        <p className="set-hint">{t('legalExportNote')}</p>
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
        {/* A toggle that saves a preference nothing acts on is worse than no
            toggle, so on a deployment with no mail the section says so. */}
        {!reminderEmailsEnabled ? (
          <p className="set-hint-flush">{t('notifEmailOff')}</p>
        ) : notif ? (
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
              <p className="set-hint-tight">
                {t('notifTimezone', { tz: notif.timezone || t('notifTimezoneUnknown') })}{' '}
                <button className="today-link" onClick={() => updateNotifications({ timezone: browserTimezone() })}>
                  {t('notifTimezoneUse')}
                </button>
              </p>
            )}
            <p className="set-hint">{t('notifReminderNote')}</p>
          </>
        ) : (
          <p className="set-body">{t('settingsNotificationsBody')}</p>
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
            <p className="set-hint-tight">{t('legalDeleteNote')}</p>
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
