import type { RelapseEvent } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import MILESTONES from '../../assets/milestones.v6.json';

/**
 * The parts of v6's Quit counter screen that are pure presentation: the 378px
 * hero, the saved / not-consumed pair, the thirty-day strip and the recovery
 * milestones.
 */

/** v6 draws the last thirty days as bars, with a relapse in danger colour. */
export const STRIP_DAYS = 30;

export function QuitHero({
  kicker,
  days,
  clock,
  since,
}: {
  kicker: string;
  days: number;
  clock: string;
  since: string;
}) {
  return (
    <div className="q-hero">
      <div className="q-hero-wash" />
      <div className="q-hero-inner">
        <div className="q-hero-chip">
          <span className="q-hero-dot" aria-hidden="true" />
          {kicker}
        </div>
        <div>
          <div className="q-hero-days">{days}</div>
          <div className="q-hero-clock">{clock}</div>
          <div className="q-hero-since">{since}</div>
        </div>
      </div>
    </div>
  );
}

export function CleanStrip({
  startDate,
  relapses,
}: {
  startDate: string;
  relapses: RelapseEvent[];
}) {
  const { t } = useLanguage();
  const relapseDates = new Set(relapses.map((r) => (r.timestamp || '').slice(0, 10)));
  const start = new Date(startDate + 'T00:00:00Z').getTime();

  const bars = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const at = Date.now() - (STRIP_DAYS - 1 - i) * 86400000;
    const date = new Date(at).toISOString().slice(0, 10);
    return {
      date,
      broke: relapseDates.has(date),
      // Before the run started the day is neither clean nor broken; v6 draws it
      // as a low stub so the beginning of the run is visible.
      inRun: at >= start,
      isToday: i === STRIP_DAYS - 1,
    };
  });

  const lastRelapse = relapses[0];
  const note = lastRelapse
    ? t('quitLastRelapse', { date: (lastRelapse.timestamp || '').slice(0, 10) })
    : t('quitStripNoRelapses', { days: STRIP_DAYS });

  return (
    <div className="q-card">
      <div className="q-card-label">{t('quitThirtyDays')}</div>
      <div className="q-strip">
        {bars.map((b) => (
          <div
            key={b.date}
            className={`q-strip-bar ${b.broke ? 'is-broke' : b.inRun ? 'is-clean' : 'is-before'} ${
              b.isToday ? 'is-today' : ''
            }`}
            title={b.date}
          />
        ))}
      </div>
      <div className="q-strip-note">{note}</div>
    </div>
  );
}

/**
 * Recovery milestones, carried over from the prototype with their source
 * attribution intact. These are health statements, so they are reproduced
 * word for word rather than paraphrased, and the disclaimer travels with them.
 */
export function RecoveryMilestones({ kind, daysClean }: { kind: string; daysClean: number }) {
  const { t, lang } = useLanguage();
  const set = (MILESTONES as Record<string, (typeof MILESTONES)['behaviour']>)[kind] ?? MILESTONES.behaviour;

  return (
    <div className="q-card">
      <div className="q-card-head">
        <span className="q-card-label">{t('quitMilestones')}</span>
        <span className="q-card-source">{set.source}</span>
      </div>
      <div className="q-ms-list">
        {set.list.map((m) => {
          const reached = daysClean >= m.days;
          return (
            <div key={m.en} className={`q-ms ${reached ? 'is-reached' : ''}`}>
              <span className="q-ms-when">{lang === 'ru' ? m.ru : m.en}</span>
              <span className="q-ms-body">{lang === 'ru' ? m.bodyRu : m.bodyEn}</span>
            </div>
          );
        })}
      </div>
      <p className="q-ms-note">{t('quitNotMedical')}</p>
    </div>
  );
}
