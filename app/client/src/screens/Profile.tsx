import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Section } from '../components/ui';

function dayOfArc(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate + 'T00:00:00Z').getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.max(1, Math.round((now - start) / 86400000) + 1);
}

const GOAL_LABEL_KEYS: Record<string, 'goalDiscipline' | 'goalBody' | 'goalFocus' | 'goalReset'> = {
  discipline: 'goalDiscipline',
  body: 'goalBody',
  focus: 'goalFocus',
  reset: 'goalReset',
};

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [focusToday, setFocusToday] = useState(0);

  useEffect(() => {
    api.get<{ habits: Habit[] }>('/habits').then((r) => setHabits(r.habits));
    api.get<{ totalSec: number }>('/focus/today').then((r) => setFocusToday(r.totalSec));
  }, []);

  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const day = dayOfArc(user?.arcStartDate ?? null);
  const daysLeft = Math.max(0, (user?.arcLengthDays ?? 90) - day);
  const goalLabel = user?.goal ? t(GOAL_LABEL_KEYS[user.goal] ?? 'profileNoGoal') : t('profileNoGoal');

  const NAV_ITEMS: { labelKey: 'programsTitle' | 'bodyTitle' | 'nutritionTitle' | 'streetTitle' | 'plannerTitle' | 'settingsTitle'; to: string }[] = [
    { labelKey: 'programsTitle', to: '/programs' },
    { labelKey: 'bodyTitle', to: '/body' },
    { labelKey: 'nutritionTitle', to: '/nutrition' },
    { labelKey: 'streetTitle', to: '/street' },
    { labelKey: 'plannerTitle', to: '/planner' },
    { labelKey: 'settingsTitle', to: '/settings' },
  ];

  return (
    <Screen title={t('profileTitle')} nav={false}>
      <Section>
        <p className="page-title" style={{ fontSize: 20, marginBottom: 2 }}>
          {user?.name || user?.email}
        </p>
        <p style={{ color: 'var(--mut)', fontSize: 13, margin: 0 }}>{user?.email}</p>
      </Section>

      <Section title={t('profileArc')}>
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="detail-stat-n">{day}</span>
            <span className="detail-stat-l">{t('profileDay')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{bestStreak}</span>
            <span className="detail-stat-l">{t('profileBestStreak')}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-n">{Math.round(focusToday / 60)}m</span>
            <span className="detail-stat-l">{t('profileFocusToday')}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--mut)', marginTop: 12 }}>{t('profileGoalLine', { goal: goalLabel, days: daysLeft })}</p>
      </Section>

      <Section title={t('profileNavigate')}>
        <div className="tr-list">
          {NAV_ITEMS.map((item) => (
            <button key={item.to} className="tr-row" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => navigate(item.to)}>
              <p className="tr-name">{t(item.labelKey)}</p>
            </button>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
