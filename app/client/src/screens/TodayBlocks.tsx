import type { QuitCounter } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../lib/format';
import { quitKindLabel } from '../lib/quitKinds';

/**
 * The two remaining blocks on v6's Today: the clean-run rows and the day
 * overview ring. Sizes are the prototype's — 20/22 and 24/22 card padding,
 * 18px radius, a 104px ring inset by 9px, 22px numerals.
 */

/** v6 shows at most three counters here and sends the rest to the Quit screen. */
export const CLEAN_RUN_LIMIT = 3;

/**
 * Zone 2: everything that is not the one thing to do now.
 *
 * Today showed seven blocks at once, all in the same card, at the same size,
 * with no answer to "what do I do first" — the blocks competed rather than
 * ranked. The detail is still one tap away; it just no longer argues with the
 * next step for the top of the screen.
 */
export function SummaryStrip({
  items,
  expanded,
  onToggle,
}: {
  items: { label: string; value: string }[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      className={`t-summary ${expanded ? 'is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? t('todayCollapse') : t('todayExpand')}
    >
      <span className="t-summary-items">
        {items.map((it, i) => (
          <span className="t-summary-item" key={it.label}>
            {i > 0 && <span className="t-summary-sep" aria-hidden="true">·</span>}
            <span className="t-summary-label">{it.label}</span>
            <span className="t-summary-value">{it.value}</span>
          </span>
        ))}
      </span>
      <span className="t-summary-chevron" aria-hidden="true">
        {expanded ? '⌃' : '⌄'}
      </span>
    </button>
  );
}

export function CleanRuns({
  counters,
  onOpen,
}: {
  counters: QuitCounter[];
  onOpen: (c: QuitCounter) => void;
}) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  /** Russian needs the day noun agreed with the number. */
  const dayWord = (n: number) => {
    if (lang !== 'ru') return n === 1 ? 'day' : 'days';
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
  };

  return (
    <div className="t-runs">
      <div className="t-runs-label">{t('todayCleanRuns')}</div>
      <div className="t-runs-list">
        {counters.slice(0, CLEAN_RUN_LIMIT).map((c) => {
          // With a cost recorded v6 shows the money saved; without one it
          // repeats the run in words rather than printing an empty currency.
          const saved =
            c.moneySaved > 0
              ? t('todaySavedAmount', { amount: formatMoney(c.moneySaved, lang, user?.currency ?? 'USD') })
              : t('todayDaysClean', { days: c.runDays, word: dayWord(c.runDays) });

          return (
            <button key={c.id} type="button" className="t-run" onClick={() => onOpen(c)}>
              <span className="t-run-days">{c.runDays}</span>
              <span className="t-run-body">
                <span className="t-run-kicker">{quitKindLabel(c.kind, t).toUpperCase()}</span>
                <span className="t-run-saved">{saved}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface OverviewArea {
  label: string;
  pct: number;
  value: string;
  tone: 'ac' | 'ok' | 'am';
}

export function DayOverview({ areas }: { areas: OverviewArea[] }) {
  const { t } = useLanguage();
  // v6 averages the areas rather than weighting them.
  const pct = areas.length ? Math.round(areas.reduce((sum, a) => sum + a.pct, 0) / areas.length) : 0;

  return (
    <div className="t-overview">
      <div className="t-overview-label">{t('todayDayOverview')}</div>
      <div className="t-overview-body">
        <div
          className="t-ring"
          style={{ background: `conic-gradient(var(--ac) ${pct}%, rgba(var(--w), 0.07) 0)` }}
          role="img"
          aria-label={`${t('todayDayClosed')} ${pct}%`}
        >
          <div className="t-ring-hole">
            <span className="t-ring-text">{pct}%</span>
          </div>
        </div>
        <div className="t-areas">
          {areas.map((a) => (
            <div key={a.label} className="t-area">
              <div className="t-area-head">
                <span className="t-area-label">{a.label}</span>
                <span className="t-area-value">{a.value}</span>
              </div>
              <div className="t-area-track">
                <div className={`t-area-fill tone-${a.tone}`} style={{ width: `${a.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The mind pair: mood and focus side by side, both sunk tiles that open their
 * screens. v6 draws seven 6px mood bars over a 36px row rather than a number,
 * and puts today's focus minutes in a 30px numeral.
 */
export function MindTiles({
  moodBars,
  moodText,
  focusText,
  onMood,
  onFocus,
}: {
  /** Newest last; null for a day with nothing logged. */
  moodBars: (number | null)[];
  moodText: string;
  focusText: string;
  onMood: () => void;
  onFocus: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="t-mind">
      <button type="button" className="t-mind-tile" onClick={onMood}>
        <div className="t-mind-label">{t('todayMood')}</div>
        <div className="t-mood-bars">
          {moodBars.map((v, i) => (
            <div
              key={i}
              className={`t-mood-bar ${v == null ? 'is-empty' : ''}`}
              // Five moods over a 36px row, with a floor so an empty day still reads.
              style={{ height: v == null ? 6 : Math.round((v / 5) * 36) }}
            />
          ))}
        </div>
        <div className="t-mind-foot">{moodText}</div>
      </button>

      <button type="button" className="t-mind-tile" onClick={onFocus}>
        <div className="t-mind-label">{t('navFocus')}</div>
        <div className="t-mind-big">{focusText}</div>
        <div className="t-mind-foot is-accent">{t('todayStartFocus')}</div>
      </button>
    </div>
  );
}
