import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useWorld } from '../context/WorldContext';
import { V6Icon } from '../components/V6Icon';

/**
 * The top of v6's Today screen: the arc hero, the next-step card and the
 * streak card. Every measurement here is transcribed from the prototype's
 * inline styles — hero 372px tall on a phone with 68/26/30 padding, a 72px
 * numeral, tiles lifted 18px into the hero with 10px gaps and 22px side
 * padding.
 */

export type Phase = 'morning' | 'afternoon' | 'evening';

/** v6 splits the day at 11:00 and 17:00. */
export function phaseOf(date = new Date()): Phase {
  const h = date.getHours();
  return h < 11 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export interface WeekDay {
  label: string;
  done: boolean;
  isToday: boolean;
  future: boolean;
}

/** v6 counts a day as held when at least 60% of what was due got marked. */
export const DAY_HELD_RATIO = 0.6;

/**
 * The week strip is derived from the habit marks themselves, as in v6 — it is
 * not a separate record. `ratios` maps an ISO date to marked/due for that day.
 */
export function weekFrom(ratios: Map<string, number>, ru: boolean, now = new Date()): WeekDay[] {
  const labels = ru
    ? ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
    : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const todayIdx = (now.getDay() + 6) % 7;
  return labels.map((label, i) => {
    const d = new Date(now.getTime() - (todayIdx - i) * 86400000);
    const future = i > todayIdx;
    const hit = ratios.get(d.toISOString().slice(0, 10)) ?? 0;
    return { label, done: !future && hit >= DAY_HELD_RATIO, isToday: i === todayIdx, future };
  });
}

export function TodayHero({
  seasonLine,
  initials,
  dayText,
  ofText,
  pct,
  summary,
}: {
  seasonLine: string;
  initials: string;
  dayText: string;
  ofText: string;
  pct: number;
  summary: string;
}) {
  const { t } = useLanguage();
  const { isFit } = useWorld();
  const navigate = useNavigate();
  const phase = phaseOf();

  const phaseLabel =
    t(phase === 'morning' ? 'phaseMorning' : phase === 'evening' ? 'phaseEvening' : 'phaseAfternoon') +
    ' · ' +
    t(isFit ? 'worldFitness' : 'worldDiscipline');

  return (
    <div className="t-hero">
      <div className="t-hero-wash" />
      <div className="t-hero-glow" />
      <div className="t-hero-inner">
        <div className="t-hero-top">
          <span className="t-hero-season">{seasonLine}</span>
          <button
            type="button"
            className="t-hero-avatar"
            aria-label={t('profileTitle')}
            onClick={() => navigate('/profile')}
          >
            {initials}
          </button>
        </div>
        <div>
          <div className="t-hero-phase">{phaseLabel}</div>
          <div className="t-hero-numrow">
            <span className="t-hero-num">{dayText}</span>
            <span className="t-hero-of">{ofText}</span>
          </div>
          <div className="t-hero-track">
            <div className="t-hero-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="t-hero-summary">{summary}</p>
        </div>
      </div>
    </div>
  );
}

export function NextStepCard({
  kicker,
  title,
  why,
  cta,
  onGo,
}: {
  kicker: string;
  title: string;
  why: string;
  cta: string;
  onGo: () => void;
}) {
  return (
    <div className="t-next">
      <div className="t-next-body">
        <div className="t-next-kicker">{kicker}</div>
        <div className="t-next-title">{title}</div>
        <div className="t-next-why">{why}</div>
      </div>
      <button type="button" className="t-next-cta" onClick={onGo}>
        {cta}
      </button>
    </div>
  );
}

export function StreakCard({ days, week }: { days: number; week: WeekDay[] }) {
  const { t } = useLanguage();
  return (
    <div className="t-streak">
      <div className="t-streak-head">
        <div className="t-streak-badge">
          <V6Icon name="flame" size={22} stroke="var(--am)" strokeWidth={1.35} />
        </div>
        <div className="t-streak-nums">
          <span className="t-streak-label">{t('todayStreak')}</span>
          <span className="t-streak-value">
            <span className="t-streak-days">{days}</span>
            <span className="t-streak-unit">{t('todayStreakUnit')}</span>
          </span>
        </div>
      </div>
      <div className="t-week">
        {week.map((d) => (
          <span key={d.label} className="t-week-day">
            <span
              className={`t-week-dot ${d.done ? 'is-done' : ''} ${d.future ? 'is-future' : ''} ${
                d.isToday && !d.done ? 'is-today' : ''
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <span className={`t-week-label ${d.isToday ? 'is-today' : ''}`}>{d.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
