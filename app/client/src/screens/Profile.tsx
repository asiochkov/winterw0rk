import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { dayOfArc } from '../lib/arc';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { useBack } from '../hooks/useBack';
import { Button, Section } from '../components/ui';

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
  const back = useBack('/more');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [focusToday, setFocusToday] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Both were bare .then() with no rejection handler: a failed request
    // showed a profile full of zeros rather than saying it could not load.
    api
      .get<{ habits: Habit[] }>('/habits')
      .then((r) => setHabits(r.habits))
      .catch(() => setLoadFailed(true));
    api
      .get<{ totalSec: number }>('/focus/today')
      .then((r) => setFocusToday(r.totalSec))
      .catch(() => setLoadFailed(true));
  }, []);

  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const day = dayOfArc(user?.arcStartDate ?? null);
  const daysLeft = Math.max(0, (user?.arcLengthDays ?? 90) - day);
  const goalLabel = user?.goal ? t(GOAL_LABEL_KEYS[user.goal] ?? 'profileNoGoal') : t('profileNoGoal');

  return (
    <Screen title={t('profileTitle')} nav={false} back={back}>
      {loadFailed && <p className="inline-error" role="alert">{t('profileLoadFailed')}</p>}
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

      {/* This carried its own menu of six links — Programs, Body, Nutrition,
          Street, Planner, Settings — which More also listed, so the same
          destinations were reachable through two unrelated menus that could
          drift apart. More is the one place now. */}
      <Section>
        <Button full variant="secondary" onClick={() => navigate('/more')}>
          {t('moreTitle')}
        </Button>
      </Section>
    </Screen>
  );
}
