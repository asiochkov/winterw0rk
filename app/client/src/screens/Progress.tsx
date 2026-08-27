import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Habit } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { V6Icon, type IconName } from '../components/V6Icon';
import { ErrorState, LoadingRows } from '../components/states';
import './progress.css';

interface Day {
  date: string;
  due: number;
  done: number;
  pct: number;
}

interface Overview {
  windowDays: number;
  rate: number;
  prevRate: number;
  delta: number;
  days: Day[];
  focusMinutes: number;
  sessions: number;
  bestCleanDays: number;
  habitCount: number;
}

type TabKey = 'overview' | 'habits';

/**
 * v6 gives Progress four tabs, and the set changes with the world — mind and
 * body in the discipline world, body and strength in the fitness one. Only the
 * two that have panels are listed here; a tab that opens nothing is worse than
 * a tab that is not there yet.
 */
const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'progressTabOverview', icon: 'progress' },
  { key: 'habits', label: 'navHabits', icon: 'habits' },
];

export default function Progress() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ov, hs] = await Promise.all([
        api.get<Overview>('/progress/overview'),
        api.get<{ habits: Habit[] }>('/habits'),
      ]);
      setData(ov);
      setHabits(hs.habits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load progress.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen nav>
        <LoadingRows rows={4} />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen nav>
        <ErrorState message={error ?? ''} onRetry={load} retryLabel={t('tryAgain')} />
      </Screen>
    );
  }

  const up = data.delta >= 0;
  const weekdays = lang === 'ru' ? ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const week = data.days.slice(-7);

  return (
    <Screen nav bleed>
      <div className="pr-head">
        <div className="pr-chip">
          <span className="pr-chip-dot" aria-hidden="true" />
          {t('progressRecord')}
        </div>
        <h1 className="pr-title">{t('progressTitle')}</h1>
      </div>

      <div className="pr-tabs wwscroll">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            className={`pr-tab ${tab === tb.key ? 'is-on' : ''}`}
            onClick={() => setTab(tb.key)}
            aria-current={tab === tb.key ? 'page' : undefined}
          >
            <V6Icon name={tb.icon} size={16} strokeWidth={1.35} />
            {t(tb.label as never)}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="pr-body">
          <div className="pr-hero">
            <div className="pr-hero-top">
              <span className="pr-hero-label">{t('progressConsistency')}</span>
              <span className={`pr-delta ${up ? 'is-up' : 'is-down'}`}>
                {up ? '+' : ''}
                {data.delta}%
              </span>
            </div>
            <div className="pr-hero-value">{data.rate}%</div>
            <div className="pr-spark">
              {data.days.map((d) => (
                <div
                  key={d.date}
                  className={`pr-spark-bar ${d.due === 0 ? 'is-rest' : ''}`}
                  // A rest day is drawn as a stub rather than a zero, which
                  // would otherwise read as a failed day.
                  style={{ height: d.due === 0 ? 4 : Math.max(4, Math.round((d.pct / 100) * 74)) }}
                  title={`${d.date} · ${d.done}/${d.due}`}
                />
              ))}
            </div>
            <p className="pr-hero-caption">
              {t('progressCaption', { days: data.windowDays, prev: data.prevRate })}
            </p>
          </div>

          <div className="pr-areas">
            <div className="pr-area">
              <div className="pr-area-label">{t('todayAreaFocus')}</div>
              <div className="pr-area-value">{t('todayFocusMinutes', { n: data.focusMinutes })}</div>
              <div className="pr-area-sub">{t('progressLastDays', { days: data.windowDays })}</div>
            </div>
            <div className="pr-area">
              <div className="pr-area-label">{t('navTrain')}</div>
              <div className="pr-area-value">{data.sessions}</div>
              <div className="pr-area-sub">{t('progressLastDays', { days: data.windowDays })}</div>
            </div>
            <div className="pr-area">
              <div className="pr-area-label">{t('todayQuit')}</div>
              <div className="pr-area-value">{data.bestCleanDays}</div>
              <div className="pr-area-sub">{t('progressBestRun')}</div>
            </div>
          </div>

          <div className="pr-week">
            <div className="pr-week-label">{t('progressDailyCompletion')}</div>
            <div className="pr-week-bars">
              {week.map((d, i) => {
                const dow = (new Date(d.date + 'T00:00:00Z').getUTCDay() + 6) % 7;
                return (
                  <div key={d.date} className="pr-week-col">
                    <div
                      className={`pr-week-bar ${d.due === 0 ? 'is-rest' : ''}`}
                      style={{ height: d.due === 0 ? 6 : Math.max(6, Math.round((d.pct / 100) * 120)) }}
                    />
                    <span className={`pr-week-day ${i === week.length - 1 ? 'is-today' : ''}`}>{weekdays[dow]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="pr-body">
          <div className="pr-habits">
            <div className="pr-week-label">{t('progressPerHabit', { days: data.windowDays })}</div>
            {habits.length === 0 && <p className="today-empty">{t('todayNothingScheduled')}</p>}
            {[...habits]
              .sort((a, b) => a.rate - b.rate)
              .map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="pr-habit"
                  onClick={() => navigate(`/habits/${h.id}`)}
                >
                  <div className="pr-habit-head">
                    <span className="pr-habit-name">{h.name}</span>
                    <span className="pr-habit-rate">{h.rate}%</span>
                  </div>
                  <div className="pr-habit-track">
                    {/* Below 60% is the same threshold that decides whether a
                        day counts as held, so it is worth marking here too. */}
                    <div
                      className={`pr-habit-fill ${h.rate < 60 ? 'is-weak' : ''}`}
                      style={{ width: `${h.rate}%` }}
                    />
                  </div>
                  <div className="pr-habit-sub">
                    {t('progressStreakBest', { streak: h.streak, best: h.best })}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </Screen>
  );
}
