import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { Habit } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../components/Shell';
import { ContextRail } from '../components/ContextRail';
import { V6Icon, type IconName } from '../components/V6Icon';
import { ErrorState, LoadingRows } from '../components/states';
import './progress.css';

interface Day {
  date: string;
  due: number;
  done: number;
  pct: number;
}

interface ReportPair {
  before: number;
  now: number;
}

interface Report {
  halfDays: number;
  discipline: ReportPair;
  focus: ReportPair;
  training: ReportPair;
}

interface Overview {
  report: Report;
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
      setError(err instanceof ApiError ? err.message : t('genericError'));
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

  /*
   * v7's reading panel. Its own version quotes a bench 1RM, a body weight and
   * a tonnage that are hardcoded demo figures; these come from the same
   * overview endpoint the screen already reads, so nothing here is invented.
   */
  const rail = (
    <ContextRail
      kicker={t('progressRecord')}
      title={t('ctxReadingTitle')}
      body={t('ctxReadingBody')}
      metrics={[
        {
          label: t('ctxWindowRate'),
          value: `${data.rate}%`,
          delta: `${data.delta >= 0 ? '+' : ''}${data.delta}`,
          direction: data.delta >= 0 ? 'up' : 'down',
          meaning: t('ctxWindowMeaning', { n: data.windowDays, prev: data.prevRate }),
        },
        {
          label: t('ctxSessions'),
          value: String(data.sessions),
          meaning: t('ctxSessionsMeaning'),
        },
        {
          label: t('ctxFocusMinutes'),
          value: String(data.focusMinutes),
          meaning: t('ctxFocusMeaning'),
        },
      ]}
      nextLabel={t('ctxNext')}
      actions={[
        { label: t('navHabits'), onClick: () => navigate('/habits') },
        { label: t('navBody'), onClick: () => navigate('/body') },
      ]}
    />
  );

  /*
   * v7's personal report. Each row states what it was against what it is, and
   * says in words what the two numbers are measuring, so a percentage never
   * stands on its own.
   */
  /*
   * A change against nothing is not a percentage. Going from 0kg to 2852kg is
   * not "+100%", and 0 minutes against 0 minutes is not "+0%" — both are
   * hollow numbers that read as findings. The first says it is new, the
   * second says there is nothing to compare.
   */
  const change = (a: number, b: number, suffix: string) => {
    if (a === 0 && b === 0) return { text: t('reportNothingYet'), up: true, muted: true };
    if (a === 0) return { text: t('reportFirst'), up: true, muted: false };
    const n = Math.round(((b - a) / a) * 100);
    return { text: `${n >= 0 ? '+' : ''}${n}${suffix}`, up: n >= 0, muted: false };
  };
  const points = (a: number, b: number) => {
    if (a === 0 && b === 0) return { text: t('reportNothingYet'), up: true, muted: true };
    const n = b - a;
    return { text: `${n >= 0 ? '+' : ''}${n}${t('reportPoints')}`, up: n >= 0, muted: false };
  };
  const reportRows = [
    {
      dim: t('reportDiscipline'),
      before: `${data.report.discipline.before}%`,
      now: `${data.report.discipline.now}%`,
      ...points(data.report.discipline.before, data.report.discipline.now),
      read: t('reportDisciplineRead', { n: data.report.halfDays }),
    },
    {
      dim: t('reportFocus'),
      before: t('reportMinutes', { n: data.report.focus.before }),
      now: t('reportMinutes', { n: data.report.focus.now }),
      ...change(data.report.focus.before, data.report.focus.now, '%'),
      read: t('reportFocusRead', { n: data.report.halfDays }),
    },
    {
      dim: t('reportTraining'),
      before: t('reportKg', { n: data.report.training.before }),
      now: t('reportKg', { n: data.report.training.now }),
      ...change(data.report.training.before, data.report.training.now, '%'),
      read: t('reportTrainingRead', { n: data.report.halfDays }),
    },
  ];

  return (
    <Screen nav bleed rail={rail}>
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

      {/* v7's personal report closes the screen: what the charts above mean,
          stated as before against now. Its rule is accent rather than neutral,
          which is how v7 marks it as a conclusion and not another section. */}
      <div className="pr-report">
        <div className="pr-report-head">
          <h2 className="pr-report-title">{t('reportTitle')}</h2>
          <span className="pr-report-period">{t('reportPeriod', { n: data.windowDays })}</span>
        </div>
        <p className="pr-report-intro">{t('reportIntro', { n: data.report.halfDays })}</p>
        <div className="pr-report-rows">
          {reportRows.map((r) => (
            <div className="pr-report-row" key={r.dim}>
              <span className="pr-report-dim">{r.dim}</span>
              <span className="pr-report-nums">
                <span className="pr-report-before">{r.before}</span>
                <span className="pr-report-arrow" aria-hidden="true">
                  →
                </span>
                <span className="pr-report-now">{r.now}</span>
              </span>
              <span
                className={`pr-report-delta ${r.muted ? 'is-muted' : r.up ? 'is-up' : 'is-down'}`}
              >
                {r.text}
              </span>
              <span className="pr-report-read">{r.read}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
