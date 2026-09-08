import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlannerTask } from '../../api/types';
import { useLanguage } from '../../context/LanguageContext';
import './timeline.css';

/** One hour of the grid, in pixels. Everything else is derived from it. */
export const HOUR_PX = 64;

/** A timed task needs to stay tappable even when it is fifteen minutes long. */
const MIN_CARD_PX = 40;

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Minutes since midnight, now. */
function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Ticks once a minute so the now-line moves without re-rendering the app. */
function useNowMinutes(active: boolean): number {
  const [min, setMin] = useState(nowMinutes);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setMin(nowMinutes()), 60000);
    return () => clearInterval(id);
  }, [active]);
  return min;
}

export function isTimed(task: PlannerTask): boolean {
  return task.startMin != null;
}

/**
 * The hour rail, shared by the day and week views so one axis cannot drift
 * from the other.
 */
/** Outside these the day is drawn quieter — a calendar that treats 3am like
 *  3pm is harder to scan than one that does not. */
const WAKING_FROM = 7;
const WAKING_TO = 22;

export function HourAxis({ from, to }: { from: number; to: number }) {
  const hours: number[] = [];
  for (let h = from; h <= to; h++) hours.push(h);
  return (
    <div className="tl-axis" style={{ height: (to - from + 1) * HOUR_PX }}>
      {hours.map((h) => (
        <div
          key={h}
          className={`tl-axis-hour ${h < WAKING_FROM || h > WAKING_TO ? 'is-quiet' : ''}`}
          style={{ top: (h - from) * HOUR_PX }}
        >
          <span className="tl-axis-label">{minutesToLabel(h * 60)}</span>
        </div>
      ))}
    </div>
  );
}

/** The hour and half-hour rules behind a lane. */
export function HourLines({ from, to }: { from: number; to: number }) {
  return (
    <>
      {Array.from({ length: to - from + 1 }, (_, i) => (
        <div
          key={`h${i}`}
          className={`tl-hourline ${(from + i) % 3 === 0 ? 'is-major' : ''}`}
          style={{ top: i * HOUR_PX }}
        />
      ))}
      {Array.from({ length: to - from + 1 }, (_, i) => (
        <div key={`m${i}`} className="tl-halfline" style={{ top: i * HOUR_PX + HOUR_PX / 2 }} />
      ))}
    </>
  );
}

export function NowLine({ from }: { from: number }) {
  const min = useNowMinutes(true);
  const top = ((min - from * 60) / 60) * HOUR_PX;
  if (top < 0) return null;
  return (
    <div className="tl-now" style={{ top }} aria-hidden="true">
      <span className="tl-now-dot" />
    </div>
  );
}

/**
 * A task on the timeline. Position and height carry the time, so a card in the
 * day view does not repeat it; the week view's columns are too narrow for the
 * position to be read precisely, so there it does.
 */
export function TimelineCard({
  task,
  from,
  compact = false,
  onOpen,
  onToggle,
}: {
  task: PlannerTask;
  from: number;
  compact?: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const start = task.startMin ?? 0;
  const end = task.endMin ?? start + 60;
  const top = ((start - from * 60) / 60) * HOUR_PX;
  const height = Math.max(MIN_CARD_PX, ((end - start) / 60) * HOUR_PX);

  return (
    <div
      className={`tl-card prio-${task.priority} ${task.done ? 'is-done' : ''} ${compact ? 'is-compact' : ''}`}
      style={{ top, height }}
    >
      {!compact && (
        <button type="button" className="tl-card-check" onClick={onToggle} aria-pressed={task.done}>
          {task.done ? '✓' : ''}
        </button>
      )}
      <button type="button" className="tl-card-body" onClick={onOpen}>
        <span className="tl-card-title">{task.title}</span>
        <span className="tl-card-time">
          {minutesToLabel(start)}–{minutesToLabel(end)}
        </span>
      </button>
    </div>
  );
}

/**
 * The visible span of hours.
 *
 * A full 24-hour grid is mostly empty space to scroll past, so the window is
 * drawn around what is actually on the day, widened to include now, and never
 * narrower than a working day.
 */
export function useHourWindow(tasks: PlannerTask[], includeNow: boolean): { from: number; to: number } {
  const now = useNowMinutes(includeNow);
  const nowHour = Math.floor(now / 60);
  return useMemo(() => {
    const timed = tasks.filter(isTimed);
    let from = 8;
    let to = 20;
    if (timed.length) {
      const earliest = Math.min(...timed.map((x) => x.startMin!));
      const latest = Math.max(...timed.map((x) => x.endMin ?? x.startMin! + 60));
      from = Math.min(from, Math.floor(earliest / 60));
      to = Math.max(to, Math.min(23, Math.ceil(latest / 60)));
    }
    if (includeNow) {
      from = Math.min(from, nowHour);
      to = Math.max(to, Math.min(23, nowHour + 1));
    }
    return { from: Math.max(0, from), to: Math.min(23, Math.max(to, from + 1)) };
  }, [tasks, includeNow, nowHour]);
}

/** Scrolls the grid to the current hour on open, the way a calendar does. */
export function useScrollToNow(from: number, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const top = ((nowMinutes() - from * 60) / 60) * HOUR_PX - HOUR_PX * 1.5;
    ref.current.scrollTop = Math.max(0, top);
  }, [from, enabled]);
  return ref;
}

/** Tasks on a day with no time — listed, not placed. */
export function LooseTasks({
  tasks,
  onOpen,
  onToggle,
}: {
  tasks: PlannerTask[];
  onOpen: (task: PlannerTask) => void;
  onToggle: (task: PlannerTask) => void;
}) {
  const { t } = useLanguage();
  if (!tasks.length) return null;
  return (
    <div className="tl-loose">
      <div className="tl-loose-label">{t('plannerNoTime')}</div>
      {tasks.map((task) => (
        <div key={task.id} className={`tl-loose-row ${task.done ? 'is-done' : ''}`}>
          <button type="button" className="tl-card-check" onClick={() => onToggle(task)} aria-pressed={task.done}>
            {task.done ? '✓' : ''}
          </button>
          <button type="button" className="tl-loose-title" onClick={() => onOpen(task)}>
            {task.title}
          </button>
        </div>
      ))}
    </div>
  );
}
