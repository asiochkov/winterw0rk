import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit, MoodEntry, QuitCounter, WorkoutSession } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { NextStepCard, StreakCard, TodayHero, weekFrom } from './TodayHero';
import { useWorld } from '../context/WorldContext';
import { Button, Section } from '../components/ui';
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
  const { t, lang } = useLanguage();
  const { isFit } = useWorld();
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

  const arcLen = user?.arcLengthDays ?? 90;
  const started = Boolean(user?.arcStartDate) && day >= 1;

  // v6 shows the countdown before the arc opens and the day count after it.
  const dayText = started ? String(day) : String(daysLeft);
  const ofText = started ? t('todayOfDays', { total: arcLen }) : t('todayDaysToStart');
  const pct = started ? Math.min(100, Math.round((day / arcLen) * 100)) : 0;

  const arcEnd = user?.arcStartDate
    ? new Date(new Date(user.arcStartDate + 'T00:00:00Z').getTime() + (arcLen - 1) * 86400000)
    : null;
  const MONTHS =
    lang === 'ru'
      ? ['ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ', 'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ']
      : ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const seasonLine = arcEnd
    ? t('todayArcSeason', { end: `${arcEnd.getUTCDate()} ${MONTHS[arcEnd.getUTCMonth()]}` })
    : '';

  const initials =
    (user?.name || user?.email || '?')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?';

  const cleanBest = counters.reduce((best, c) => (c.runDays > best ? c.runDays : best), 0);
  const summary = t('todaySummary', {
    done: doneCount,
    total: todaysHabits.length,
    session: restDay ? t('todaySessionRest') : session ? t('todaySessionPlanned') : t('todaySessionRest'),
    clean: lang === 'ru' ? `без ${cleanBest} дн.` : `${cleanBest} days clean`,
  });

  // The week strip reads the habit marks, exactly as the prototype does: a day
  // counts when everything scheduled for it was closed, which is the same rule
  // that decides whether the streak survived.
  const perDay = new Map<string, { scheduled: number; done: number }>();
  for (const h of habits) {
    for (const d of h.week) {
      if (!d.scheduled) continue;
      const cur = perDay.get(d.date) ?? { scheduled: 0, done: 0 };
      cur.scheduled += 1;
      if (d.done) cur.done += 1;
      perDay.set(d.date, cur);
    }
  }
  const doneDates = new Set<string>(
    [...perDay.entries()].filter(([, v]) => v.scheduled > 0 && v.done === v.scheduled).map(([d]) => d)
  );
  const week = weekFrom(doneDates, lang === 'ru');

  // Priority in v6: unfinished session → today's workout → open habits → mood.
  const openHabits = todaysHabits.filter((h) => !h.doneToday);
  const next = (() => {
    if (session && session.status !== 'completed' && !restDay) {
      return {
        kicker: t('todayNext'),
        title: session.name,
        why: t('trainingExercisesCount', { n: session.exercises.length }),
        cta: t('todayStart'),
        go: () => navigate('/training'),
      };
    }
    if (openHabits.length) {
      return {
        kicker: t('todayNextHabitsKicker'),
        title: t('todayNextHabitsTitle', { n: openHabits.length }),
        why: t('todayNextHabitsWhy'),
        cta: t('todayNextOpen'),
        go: () => navigate('/habits'),
      };
    }
    if (!mood) {
      return {
        kicker: t('todayNextMoodKicker'),
        title: t('todayNextMoodTitle'),
        why: t('todayNextMoodWhy'),
        cta: t('todayNextLog'),
        go: () => navigate('/mood'),
      };
    }
    return {
      kicker: t('todayNextDoneKicker'),
      title: t('todayNextDoneTitle'),
      why: t('todayNextDoneWhy'),
      cta: t('todayNextOpen'),
      go: () => navigate(isFit ? '/training' : '/habits'),
    };
  })();

  return (
    <Screen nav bleed>
      <TodayHero
        seasonLine={seasonLine}
        initials={initials}
        dayText={dayText}
        ofText={ofText}
        pct={pct}
        summary={summary}
      />

      <div className="t-tiles">
        <NextStepCard kicker={next.kicker} title={next.title} why={next.why} cta={next.cta} onGo={next.go} />
        <StreakCard days={bestStreak} week={week} />
      </div>

      <div className="t-below">
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
      </div>
    </Screen>
  );
}
