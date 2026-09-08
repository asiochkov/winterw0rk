import type { PlannerTask } from '../../api/types';
import { HourAxis, HOUR_PX, NowLine, TimelineCard, isTimed, useHourWindow } from './Timeline';

/** The calendar date this weekday falls on in the week being shown. The tasks
 *  themselves are stored by weekday, but a column header without a date is
 *  hard to place against a real calendar. */
function dateOfWeekday(weekday: number, todayIndex: number): number {
  const d = new Date();
  d.setDate(d.getDate() + (weekday - todayIndex));
  return d.getDate();
}

/**
 * The week as one grid: a single hour axis on the left and seven day columns
 * scrolling together, the way a calendar does — not seven independent lists.
 *
 * Tapping a column header opens that day full width. The two are the same
 * calendar at two zoom levels, which is the whole point of the request.
 */
export function WeekTimeline({
  tasks,
  dayLabels,
  todayIndex,
  onExpandDay,
  onOpen,
  onToggle,
}: {
  tasks: PlannerTask[];
  dayLabels: string[];
  todayIndex: number;
  onExpandDay: (weekday: number) => void;
  onOpen: (task: PlannerTask) => void;
  onToggle: (task: PlannerTask) => void;
}) {
  const timed = tasks.filter((task) => !task.backlog && isTimed(task));
  const { from, to } = useHourWindow(timed, true);

  return (
    <div className="tl-week">
      <div className="tl-week-head">
        <div className="tl-week-axis-gap" />
        {dayLabels.map((label, i) => {
          const count = tasks.filter((task) => task.weekday === i && !task.backlog).length;
          return (
            <button
              key={label}
              type="button"
              className={`tl-week-day ${i === todayIndex ? 'is-today' : ''}`}
              onClick={() => onExpandDay(i)}
            >
              <span className="tl-week-day-label">{label}</span>
              <span className="tl-week-day-date">{dateOfWeekday(i, todayIndex)}</span>
              {/* Load as dots rather than a number: a numeral next to a date
                  reads as part of the date. */}
              {count > 0 && (
                <span className="tl-week-day-load" aria-label={String(count)}>
                  {Array.from({ length: Math.min(3, count) }, (_, d) => (
                    <span key={d} className="tl-week-day-dot" />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="tl-scroll">
        <div className="tl-grid" style={{ height: (to - from + 1) * HOUR_PX }}>
          <HourAxis from={from} to={to} />
          <div className="tl-week-cols">
            {dayLabels.map((label, i) => (
              <div key={label} className="tl-week-col">
                {Array.from({ length: to - from + 1 }, (_, h) => (
                  <div key={h} className="tl-hourline" style={{ top: h * HOUR_PX }} />
                ))}
                {timed
                  .filter((task) => task.weekday === i)
                  .map((task) => (
                    <TimelineCard
                      key={task.id}
                      task={task}
                      from={from}
                      compact
                      onOpen={() => onOpen(task)}
                      onToggle={() => onToggle(task)}
                    />
                  ))}
                {/* Only today's column carries the now-line: drawing it across
                    the whole week would say every day is at this time. */}
                {i === todayIndex && <NowLine from={from} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
