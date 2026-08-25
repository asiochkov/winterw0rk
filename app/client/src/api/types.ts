export interface User {
  id: number;
  email: string;
  name: string;
  goal: string | null;
  areas: string[];
  arcStartDate: string | null;
  arcLengthDays: number;
  onboarded: boolean;
  plan: 'free' | 'plus';
  planStatus: string;
  planPeriodEnd: string | null;
  isAdmin: boolean;
  status: 'active' | 'suspended';
  /** True when the legal documents changed since this user last accepted them. */
  needsConsent: boolean;
}

export type HabitType = 'bool' | 'count' | 'time';

export interface HabitWeekDay {
  date: string;
  scheduled: boolean;
  done: boolean;
  value: number;
}

export interface Habit {
  id: number;
  name: string;
  type: HabitType;
  category: string;
  schedule: number[];
  target: number | null;
  unit: string | null;
  step: number | null;
  archived: boolean;
  todayValue: number;
  doneToday: boolean;
  scheduledToday: boolean;
  streak: number;
  best: number;
  rate: number;
  week: HabitWeekDay[];
}

export interface HabitHistoryEntry {
  date: string;
  value: number;
  note: string | null;
}

export interface QuitCounter {
  id: number;
  kind: string;
  startDate: string;
  unitCost: number;
  dailyAmount: number;
  goalAmount: number | null;
  goalLabel: string | null;
  runDays: number;
  bestRunDays: number;
  totalCleanDays: number;
  attempts: number;
  moneySaved: number;
  unitsAvoided: number;
}

export interface CravingEpisode {
  id: number;
  timestamp: string;
  intensity: number;
  trigger: string | null;
  coping_action: string | null;
}

export interface RelapseEvent {
  id: number;
  timestamp: string;
  trigger: string | null;
  note: string | null;
  run_days: number;
}

export interface SetEntry {
  id: number;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
  completedAt: string | null;
}

export interface SessionExercise {
  sessionExerciseId: number;
  exerciseId: string;
  name: string;
  group: string;
  equipment: string;
  cue: string;
  errors: string[];
  previous: { weight: number; reps: number } | null;
  sets: SetEntry[];
}

export type SessionStatus = 'planned' | 'active' | 'completed' | 'skipped';

export interface WorkoutSession {
  id: number;
  date: string;
  name: string;
  status: SessionStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationSec: number | null;
  feeling: number | null;
  notes: string | null;
  exercises: SessionExercise[];
}

export interface SessionSummary {
  tonnage: number;
  setCount: number;
  durationSec: number;
  prs: { exercise: string; weight: number; reps: number }[];
}

export interface MoodEntry {
  id: number;
  date: string;
  mood: number;
  tag: string | null;
  note: string | null;
}

export type FocusMode = 'pomodoro' | 'deep' | 'custom';

export type TaskPriority = 'low' | 'normal' | 'high';
export type TaskRecurrence = 'none' | 'daily' | 'weekly';

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
}

export interface PlannerTask {
  id: number;
  title: string;
  priority: TaskPriority;
  weekday: number | null;
  recurrence: TaskRecurrence;
  backlog: boolean;
  done: boolean;
  subtasks: Subtask[];
}

export interface ExerciseListItem {
  id: string;
  name: string;
  group: string;
  equipment: string;
  level: string;
  type: string;
}

export interface ExerciseDetailData {
  id: string;
  name: string;
  group: string;
  equipment: string;
  level: string;
  type: string;
  cue: string;
  errors: string[];
}

export interface FocusSessionRecord {
  id: number;
  mode: FocusMode;
  planned_sec: number;
  actual_sec: number | null;
  started_at: string;
  finished_at: string | null;
  completed: number;
}
