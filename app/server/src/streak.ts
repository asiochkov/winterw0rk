import { addDays, scheduledOn, todayStr } from './util.js';

export interface HabitLike {
  type: 'bool' | 'count' | 'time';
  schedule: number[];
  target: number | null;
}

export interface EntryLike {
  date: string;
  value: number;
}

function isCompleted(habit: HabitLike, entry: EntryLike | undefined): boolean {
  if (!entry) return false;
  if (habit.type === 'bool') return entry.value >= 1;
  return habit.target != null ? entry.value >= habit.target : entry.value > 0;
}

export function computeStats(habit: HabitLike, entries: EntryLike[]) {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const today = todayStr();

  // Current streak: walk backward from today, skipping unscheduled days.
  let streak = 0;
  let cursor = today;
  for (let i = 0; i < 3650; i++) {
    if (!scheduledOn(habit.schedule, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const done = isCompleted(habit, byDate.get(cursor));
    if (done) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (cursor === today) {
      // today isn't done yet — doesn't break the streak, just isn't counted
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  // Best streak + 30-day consistency: scan the recorded date range chronologically.
  const dates = [...byDate.keys()].sort();
  let best = 0;
  let running = 0;
  const earliest = dates[0] || today;
  let day = earliest;
  while (day <= today) {
    if (scheduledOn(habit.schedule, day)) {
      if (isCompleted(habit, byDate.get(day))) {
        running++;
        best = Math.max(best, running);
      } else if (day !== today) {
        running = 0;
      }
    }
    day = addDays(day, 1);
  }
  best = Math.max(best, streak);

  let scheduled30 = 0;
  let done30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, -i);
    if (scheduledOn(habit.schedule, d)) {
      scheduled30++;
      if (isCompleted(habit, byDate.get(d))) done30++;
    }
  }
  const rate = scheduled30 > 0 ? Math.round((done30 / scheduled30) * 100) : 0;

  return { streak, best, rate };
}
