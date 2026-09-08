import type { PlannerTask } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import {
  HourAxis,
  HourLines,
  HOUR_PX,
  LooseTasks,
  NowLine,
  TimelineCard,
  isTimed,
  useHourWindow,
  useScrollToNow,
} from './Timeline';

/**
 * One day as a timeline.
 *
 * The planner drew a week as seven vertical lists — a to-do list grouped by
 * weekday, with no notion of when in the day anything happened. This is the
 * same tasks, placed.
 */
export function DayTimeline({
  weekday,
  tasks,
  isToday,
  onOpen,
  onToggle,
}: {
  weekday: number;
  tasks: PlannerTask[];
  isToday: boolean;
  onOpen: (task: PlannerTask) => void;
  onToggle: (task: PlannerTask) => void;
}) {
  const { t } = useLanguage();
  const dayTasks = tasks.filter((task) => task.weekday === weekday && !task.backlog);
  const timed = dayTasks.filter(isTimed);
  const loose = dayTasks.filter((task) => !isTimed(task));
  const { from, to } = useHourWindow(timed, isToday);
  const scrollRef = useScrollToNow(from, isToday);

  return (
    <div className="tl-day">
      <LooseTasks tasks={loose} onOpen={onOpen} onToggle={onToggle} />

      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-grid" style={{ height: (to - from + 1) * HOUR_PX }}>
          <HourAxis from={from} to={to} />
          <div className="tl-lane">
            <HourLines from={from} to={to} />
            {timed.map((task) => (
              <TimelineCard
                key={task.id}
                task={task}
                from={from}
                onOpen={() => onOpen(task)}
                onToggle={() => onToggle(task)}
              />
            ))}
            {isToday && <NowLine from={from} />}
            {timed.length === 0 && (
              <div className="tl-empty-state">
                <p className="tl-empty-title">{t('plannerNoTimedTasks')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
