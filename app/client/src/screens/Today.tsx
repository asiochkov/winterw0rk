import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit, MoodEntry, QuitCounter, WorkoutSession } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { Button, Section, ProgressBar, Pill } from '../components/ui';
import { ErrorState, LoadingRows } from '../components/states';
import { useMutation } from '../hooks/useAsyncData';
import './today.css';

const MOOD_KEYS = ['moodTerrible', 'moodBad', 'moodNeutral', 'moodGood', 'moodExcellent'] as const;

function dayOfArc(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate + 'T00:00:00Z').getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.max(1, Math.round((now - start) / 86400000) + 1);
}

export default function Today() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [counters, setCounters] = useState<QuitCounter[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [restDay, setRestDay] = useState(false);
  const [mood, setMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mutation = useMutation();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [h, q, tr, m] = await Promise.all([
        api.get<{ habits: Habit[] }>('/habits'),
        api.get<{ counters: QuitCounter[] }>('/quit'),
        api.get<{ session: WorkoutSession | null; restDay: boolean }>('/training/today'),
        api.get<{ entry: MoodEntry | null }>('/mood/today'),
      ]);
      setHabits(h.habits);
      setCounters(q.counters);
      setSession(tr.session);
      setRestDay(tr.restDay);
      setMood(m.entry);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load today.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function completeHabit(habit: Habit) {
    const value =
      habit.type === 'bool'
        ? habit.doneToday
          ? 0
          : 1
        : Math.min((habit.target || 0) * 2, habit.todayValue + (habit.step || 1));
    const ok = await mutation.run(() => api.post(`/habits/${habit.id}/complete`, { value }));
    if (ok) load();
  }

  async function pickMood(k: number) {
    await mutation.run(async () => {
      const { entry } = await api.post<{ entry: MoodEntry }>('/mood', { mood: k });
      setMood(entry);
    });
  }

  if (loading) {
    return (
      <Screen nav>
        <LoadingRows rows={4} />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen nav>
        <ErrorState message={loadError} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }

  const todaysHabits = habits.filter((h) => h.scheduledToday && !h.archived);
  const doneCount = todaysHabits.filter((h) => h.doneToday).length;
  const day = dayOfArc(user?.arcStartDate ?? null);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const daysLeft = Math.max(0, (user?.arcLengthDays ?? 90) - day);

  const rail = (
    <Section title={t('profileArc')}>
      <div className="detail-stats" style={{ marginBottom: 16 }}>
        <div className="detail-stat">
          <span className="detail-stat-n">{day}</span>
          <span className="detail-stat-l">{t('profileDay')}</span>
        </div>
        <div className="detail-stat">
          <span className="detail-stat-n">{bestStreak}</span>
          <span className="detail-stat-l">{t('profileBestStreak')}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--mut)', margin: '0 0 16px' }}>{t('daysLeftInArc', { days: daysLeft })}</p>
      <button className="today-link" onClick={() => navigate('/profile')}>
        {t('profileTitle')}
      </button>
    </Section>
  );

  return (
    <Screen nav rail={rail}>
      <Section>
        <p className="today-kicker">{t('todayDayOf', { day, total: user?.arcLengthDays ?? 90 })}</p>
        <h1 className="today-headline">{t('todayHabitsClosed', { done: doneCount, total: todaysHabits.length })}</h1>
        <ProgressBar value={todaysHabits.length ? (doneCount / todaysHabits.length) * 100 : 0} />
      </Section>

      <Section title={t('todayNext')}>
        {!restDay && session ? (
          <button className="today-next" onClick={() => navigate('/training')}>
            <div>
              <p className="today-next-title">{session.name}</p>
              <p className="today-next-sub">
                {t('trainingExercisesCount', { n: session.exercises.length })} · {session.status === 'completed' ? t('todayDoneLabel') : t('todayStart')}
              </p>
            </div>
            <Pill tone={session.status === 'completed' ? 'ok' : 'ac'}>
              {session.status === 'completed' ? t('todayDoneLabel') : t('todayStart')}
            </Pill>
          </button>
        ) : restDay ? (
          <p className="today-rest">{t('todayRestDay')}</p>
        ) : null}
      </Section>

      <Section title={t('todayHabits')} action={<button className="today-link" onClick={() => navigate('/habits')}>{t('all')}</button>}>
        {mutation.error && <p className="inline-error">{mutation.error}</p>}
        <div className="today-habit-list">
          {todaysHabits.length === 0 && <p className="today-empty">{t('todayNothingScheduled')}</p>}
          {todaysHabits.map((h) => (
            <button key={h.id} className={`today-habit ${h.doneToday ? 'today-habit-done' : ''}`} onClick={() => completeHabit(h)}>
              <span className={`today-check ${h.doneToday ? 'today-check-on' : ''}`} />
              <span className="today-habit-name">{h.name}</span>
              <span className="today-habit-meta">
                {h.type === 'bool' ? `${h.streak}${t('streakSuffix')}` : `${h.todayValue}/${h.target} ${h.unit || ''}`}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {counters.length > 0 && (
        <Section title={t('todayQuit')} action={<button className="today-link" onClick={() => navigate('/quit')}>{t('all')}</button>}>
          <div className="today-quit-row">
            {counters.map((c) => (
              <div key={c.id} className="today-quit-chip">
                <span className="today-quit-days">{c.runDays}</span>
                <span className="today-quit-kind">{c.kind}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={t('todayMood')}>
        {mood ? (
          <p className="today-mood-set">{t('todayMoodRecorded', { label: t(MOOD_KEYS[mood.mood - 1]) })}</p>
        ) : (
          <div className="today-mood-row">
            {MOOD_KEYS.map((key, i) => (
              <button key={key} className="today-mood-btn" onClick={() => pickMood(i + 1)} title={t(key)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </Section>

      {habits.length === 0 && (
        <Section>
          <Button full variant="secondary" onClick={() => navigate('/habits/new')}>
            {t('todayAddFirstHabit')}
          </Button>
        </Section>
      )}
    </Screen>
  );
}
