import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit, MoodEntry, QuitCounter, WorkoutSession } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { ContextRail } from '../components/ContextRail';
import { NextStepCard, StreakCard, TodayHero, phaseOf, weekFrom } from './TodayHero';
import { TodayHabits } from './TodayHabits';
import { CleanRuns, DayOverview, MindTiles, type OverviewArea } from './TodayBlocks';
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
  const [focusSec, setFocusSec] = useState(0);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mutation = useMutation();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [h, q, tr, m, f, mh] = await Promise.all([
        api.get<{ habits: Habit[] }>('/habits'),
        api.get<{ counters: QuitCounter[] }>('/quit'),
        api.get<{ session: WorkoutSession | null; restDay: boolean }>('/training/today'),
        api.get<{ entry: MoodEntry | null }>('/mood/today'),
        // The day-overview ring needs today's focus minutes alongside the rest.
        api.get<{ totalSec: number }>('/focus/today'),
        // The mood tile draws the last week rather than a single value.
        api.get<{ entries: MoodEntry[] }>('/mood/history'),
      ]);
      setHabits(h.habits);
      setCounters(q.counters);
      setSession(tr.session);
      setRestDay(tr.restDay);
      setMood(m.entry);
      setFocusSec(f.totalSec);
      setMoodHistory(mh.entries);
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

  async function stepHabit(habit: Habit, delta: number) {
    const value = Math.max(0, habit.todayValue + delta);
    const ok = await mutation.run(() => api.post(`/habits/${habit.id}/complete`, { value }));
    if (ok) load();
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
  // is held when most of what was due got marked, not all of it.
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
  const ratios = new Map<string, number>(
    [...perDay.entries()].map(([d, v]) => [d, v.scheduled ? v.done / v.scheduled : 0])
  );
  const week = weekFrom(ratios, lang === 'ru');

  /*
   * The desktop rail. Its 300px column was reserved in CSS and left empty on
   * every screen, which is what made a laptop look broken. v7 fills it with
   * per-screen context, and measures each figure against the user's own
   * 30-day average rather than an absolute target.
   */
  const railHabitRate = todaysHabits.length ? Math.round((doneCount / todaysHabits.length) * 100) : 0;
  const rate30 = habits.length
    ? Math.round(habits.reduce((sum, h) => sum + (h.rate ?? 0), 0) / habits.length)
    : 0;
  const rail = (
    <ContextRail
      kicker={t('ctxDayKicker')}
      title={t('ctxDayTitle')}
      body={t('ctxDayBody')}
      metrics={[
        {
          label: t('ctxHabitsToday'),
          value: `${doneCount}/${todaysHabits.length}`,
          delta: `${railHabitRate}%`,
          direction: railHabitRate >= rate30 ? 'up' : 'down',
          meaning: t('ctxAverage', { n: rate30 }),
        },
        {
          label: t('ctxCleanDays'),
          value: String(cleanBest),
          meaning: counters.length
            ? t('ctxCleanMeaning', { n: counters.length })
            : t('ctxCleanNone'),
        },
        {
          label: t('ctxStreak'),
          value: String(bestStreak),
          meaning: t('ctxStreakMeaning'),
        },
      ]}
      nextLabel={t('ctxNext')}
      actions={[
        { label: t('navHabits'), hint: `${todaysHabits.length - doneCount}`, onClick: () => navigate('/habits') },
        { label: t('navProgress'), onClick: () => navigate('/progress') },
        { label: t('navPlanner'), onClick: () => navigate('/planner') },
      ]}
    />
  );

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

  const focusMin = Math.round(focusSec / 60);

  // Seven days of mood, oldest first, with a gap where nothing was logged.
  const moodByDate = new Map(moodHistory.map((e) => [e.date, e.mood]));
  const moodBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    return moodByDate.get(d) ?? null;
  });
  const habitRate = todaysHabits.length ? Math.round((doneCount / todaysHabits.length) * 100) : 0;
  // v6's three areas, averaged for the ring: habits, an hour of focus, mood.
  const overviewAreas: OverviewArea[] = [
    { label: t('todayAreaHabits'), pct: habitRate, value: `${doneCount}/${todaysHabits.length}`, tone: 'ac' },
    {
      label: t('todayAreaFocus'),
      pct: Math.min(100, Math.round((focusMin / 60) * 100)),
      value: t('todayFocusMinutes', { n: focusMin }),
      tone: 'ok',
    },
    {
      label: t('todayAreaMood'),
      pct: mood ? 100 : 0,
      value: mood ? t('todayMoodRecordedShort') : t('todayMoodNone'),
      tone: 'am',
    },
  ];

  // v6 reorders Today's blocks by time of day and world: mind leads in the
  // evening, training leads in the fitness world, habits lead otherwise.
  const evening = phaseOf() === 'evening';
  const order = isFit
    ? evening
      ? { workout: 3, habits: 4, quit: 5, mind: 1, body: 2 }
      : { workout: 1, habits: 3, quit: 4, mind: 5, body: 2 }
    : evening
      ? { workout: 5, habits: 2, quit: 3, mind: 1, body: 6 }
      : { workout: 4, habits: 1, quit: 2, mind: 3, body: 5 };

  return (
    <Screen nav bleed rail={rail}>
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

      <div className="t-below t-blocks">
        <div className="t-block" style={{ order: order.habits }}>
          <TodayHabits
            habits={todaysHabits}
            doneCount={doneCount}
            onToggle={completeHabit}
            onStep={stepHabit}
            onOpenAll={() => navigate('/habits')}
          />
          {mutation.error && <p className="inline-error">{mutation.error}</p>}
        </div>

        {counters.length > 0 && (
          <div className="t-block" style={{ order: order.quit }}>
            <CleanRuns counters={counters} onOpen={(c) => navigate(`/quit/${c.id}`)} />
          </div>
        )}

        <div className="t-block" style={{ order: order.quit }}>
          <DayOverview areas={overviewAreas} />
        </div>

        <div className="t-block" style={{ order: order.mind }}>
          <MindTiles
            moodBars={moodBars}
            moodText={mood ? t(MOOD_KEYS[mood.mood - 1]) : t('todayMoodNotLogged')}
            focusText={t('todayFocusMinutes', { n: focusMin })}
            onMood={() => navigate('/mood')}
            onFocus={() => navigate('/focus')}
          />
        </div>

        {habits.length === 0 && (
          <div className="t-block" style={{ order: 99 }}>
            <Section>
              <Button full variant="secondary" onClick={() => navigate('/habits/new')}>
                {t('todayAddFirstHabit')}
              </Button>
            </Section>
          </div>
        )}
      </div>
    </Screen>
  );
}
