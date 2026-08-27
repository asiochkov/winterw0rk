import type { Habit } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import { V6Icon, type IconName } from '../../components/V6Icon';

/**
 * A habit as v6 draws it on the Habits screen — fuller than the Today card:
 * a 38px pod, a 16px name, two meta lines, a 48px control, a readout and bar
 * for anything counted, and the week as seven 26px cells.
 */

const CATEGORY: Record<string, { rgb: string; icon: IconName }> = {
  TRAINING: { rgb: '--amr', icon: 'train' },
  MIND: { rgb: '--acr', icon: 'focus' },
  BODY: { rgb: '--okr', icon: 'body' },
  FOCUS: { rgb: '--mutr', icon: 'ring' },
};
const FALLBACK = { rgb: '--mutr', icon: 'dot' as IconName };

function stepLabel(step: number): string {
  return '+' + (step >= 1000 ? `${step / 1000}k` : step);
}

export function HabitRow({
  habit,
  onOpen,
  onToggle,
  onStep,
}: {
  habit: Habit;
  onOpen: () => void;
  onToggle: () => void;
  onStep: (delta: number) => void;
}) {
  const { t, lang } = useLanguage();
  const cat = CATEGORY[habit.category] ?? FALLBACK;
  const isBool = habit.type === 'bool';

  const unit =
    lang === 'ru'
      ? ({ L: 'л', ML: 'мл', MIN: 'мин', H: 'ч', KM: 'км', KCAL: 'ккал', PAGES: 'стр', STEPS: 'шагов' } as Record<string, string>)[
          habit.unit ?? ''
        ] ?? habit.unit ?? ''
      : habit.unit ?? '';

  const typeLabel = t(isBool ? 'habitTypeBool' : habit.type === 'count' ? 'habitTypeCount' : 'habitTypeTime');
  const schedText =
    habit.schedule.length === 7 ? t('todayHabitDaily') : t('todayHabitPerWeek', { n: habit.schedule.length });

  const pct = habit.target ? Math.min(100, Math.round((habit.todayValue / habit.target) * 100)) : 0;
  // habit.week is a rolling seven days ending today, not a Monday-first week,
  // so the letter has to come from each entry's own date.
  const weekLabels = lang === 'ru' ? ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const labelFor = (iso: string) => weekLabels[(new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7];

  return (
    <div className={`hb-row ${habit.doneToday ? 'is-done' : ''}`}>
      <div className="hb-row-top">
        <span className="hb-pod" style={{ background: `rgba(var(${cat.rgb}), 0.14)` }}>
          <V6Icon name={cat.icon} size={19} stroke={`rgb(var(${cat.rgb}))`} strokeWidth={1.35} />
        </span>

        <button type="button" className="hb-open" onClick={onOpen}>
          <div className="hb-name">{habit.name}</div>
          <div className="hb-meta">
            <div className="hb-meta-line">
              <span>{typeLabel}</span>
              <span className="hb-meta-sep">·</span>
              <span>{schedText}</span>
            </div>
            <div className="hb-meta-line">
              <span className={habit.streak > 0 ? 'hb-streak is-on' : 'hb-streak'}>
                {habit.streak > 0 ? t('habitStreakDays', { n: habit.streak }) : t('habitNoStreak')}
              </span>
              <span className="hb-rate">{habit.rate}%</span>
            </div>
          </div>
        </button>

        {isBool ? (
          <button
            type="button"
            className={`hb-box ${habit.doneToday ? 'is-on' : ''}`}
            aria-label={t('todayHabitComplete')}
            aria-pressed={habit.doneToday}
            onClick={onToggle}
          >
            {habit.doneToday ? '✓' : ''}
          </button>
        ) : (
          <div className="hb-steppers">
            <button type="button" className="hb-minus" aria-label={t('todayHabitMinus')} onClick={() => onStep(-(habit.step || 1))}>
              −
            </button>
            <button
              type="button"
              className={`hb-plus ${habit.doneToday ? 'is-on' : ''}`}
              aria-label={t('todayHabitPlus')}
              onClick={() => onStep(habit.step || 1)}
            >
              {habit.type === 'time' ? t('todayHabitTimer') : stepLabel(habit.step || 1)}
            </button>
          </div>
        )}
      </div>

      {!isBool && (
        <>
          <div className={`hb-readout ${habit.doneToday ? 'is-met' : ''}`}>
            {habit.todayValue}
            {unit ? ` ${unit}` : ''} / {habit.target ?? 0}
            {unit ? ` ${unit}` : ''}
          </div>
          <div className="hb-bar-track">
            <div className="hb-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="hb-prog">
            {pct}% · {habit.streak > 0 ? t('habitStreakDays', { n: habit.streak }) : '—'}
          </div>
        </>
      )}

      <div className="hb-week">
        {habit.week.map((d) => (
          <div
            key={d.date}
            className={`hb-cell ${!d.scheduled ? 'is-off' : d.done ? 'is-done' : 'is-miss'}`}
            title={d.date}
          >
            {labelFor(d.date)}
          </div>
        ))}
      </div>
    </div>
  );
}
