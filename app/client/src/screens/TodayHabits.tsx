import type { Habit } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { V6Icon, type IconName } from '../components/V6Icon';

/**
 * The habits card on v6's Today. Not the full list — the prototype shows at
 * most six of the habits scheduled for today and sends the rest to the Habits
 * screen, so the card stays the same height whatever the account holds.
 */
export const TODAY_HABIT_LIMIT = 6;

/**
 * Category colour is a signal, not decoration: it groups the list at a glance.
 * The pairs are v6's, and every colour is a token — there is no literal
 * palette here, so both themes keep working.
 */
const CATEGORY: Record<string, { rgb: string; icon: IconName }> = {
  TRAINING: { rgb: '--amr', icon: 'train' },
  MIND: { rgb: '--acr', icon: 'focus' },
  BODY: { rgb: '--okr', icon: 'body' },
  FOCUS: { rgb: '--mutr', icon: 'ring' },
};
const FALLBACK = { rgb: '--mutr', icon: 'dot' as IconName };

/** v6 abbreviates a step of 1000 or more, so +1000 reads as +1k. */
function stepLabel(step: number): string {
  return '+' + (step >= 1000 ? `${step / 1000}k` : step);
}

export function TodayHabits({
  habits,
  doneCount,
  onToggle,
  onStep,
  onOpenAll,
}: {
  habits: Habit[];
  doneCount: number;
  onToggle: (h: Habit) => void;
  onStep: (h: Habit, delta: number) => void;
  onOpenAll: () => void;
}) {
  const { t, lang } = useLanguage();
  const shown = habits.slice(0, TODAY_HABIT_LIMIT);

  const unitLabel = (unit: string | null) => {
    if (!unit) return '';
    if (lang !== 'ru') return unit;
    const ru: Record<string, string> = { L: 'л', ML: 'мл', MIN: 'мин', H: 'ч', KM: 'км', KCAL: 'ккал', PAGES: 'стр', STEPS: 'шагов' };
    return ru[unit] ?? unit;
  };

  return (
    <div className="t-habits">
      <div className="t-habits-head">
        <span className="t-habits-label">{t('todayHabits')}</span>
        <button type="button" className="t-habits-count" onClick={onOpenAll}>
          {doneCount} / {habits.length}
        </button>
      </div>

      {shown.length === 0 && <p className="today-empty">{t('todayNothingScheduled')}</p>}

      <div className="t-habits-list">
        {shown.map((h) => {
          const cat = CATEGORY[h.category] ?? FALLBACK;
          const unit = unitLabel(h.unit);
          const isBool = h.type === 'bool';
          const sub = isBool
            ? h.doneToday
              ? t('todayHabitDone')
              : h.schedule.length === 7
                ? t('todayHabitDaily')
                : t('todayHabitPerWeek', { n: h.schedule.length })
            : `${h.todayValue}${unit ? ' ' + unit : ''} / ${h.target ?? 0}${unit ? ' ' + unit : ''}`;

          return (
            <div key={h.id} className={`t-habit ${h.doneToday ? 'is-done' : ''}`}>
              <span
                className="t-habit-pod"
                style={{ background: `rgba(var(${cat.rgb}), 0.14)` }}
              >
                <V6Icon name={cat.icon} size={19} stroke={`rgb(var(${cat.rgb}))`} strokeWidth={1.35} />
              </span>

              <div className="t-habit-body">
                <div className="t-habit-name">{h.name}</div>
                <div className="t-habit-sub">{sub}</div>
              </div>

              {isBool ? (
                <button
                  type="button"
                  className={`t-habit-box ${h.doneToday ? 'is-on' : ''}`}
                  aria-label={t('todayHabitComplete')}
                  aria-pressed={h.doneToday}
                  onClick={() => onToggle(h)}
                >
                  {h.doneToday ? '✓' : ''}
                </button>
              ) : (
                <div className="t-habit-steppers">
                  <button
                    type="button"
                    className="t-habit-minus"
                    aria-label={t('todayHabitMinus')}
                    onClick={() => onStep(h, -(h.step || 1))}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className={`t-habit-plus ${h.doneToday ? 'is-on' : ''}`}
                    aria-label={t('todayHabitPlus')}
                    onClick={() => onStep(h, h.step || 1)}
                  >
                    {h.type === 'time' ? t('todayHabitTimer') : stepLabel(h.step || 1)}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
