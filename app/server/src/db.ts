import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'winterwork.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  goal TEXT,
  areas TEXT NOT NULL DEFAULT '[]',
  arc_start_date TEXT,
  arc_length_days INTEGER NOT NULL DEFAULT 90,
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bool','count','time')),
  category TEXT NOT NULL DEFAULT 'GENERAL',
  schedule TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  target REAL,
  unit TEXT,
  step REAL,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  note TEXT,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS quit_counters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  start_date TEXT NOT NULL,
  unit_cost REAL NOT NULL DEFAULT 0,
  daily_amount REAL NOT NULL DEFAULT 0,
  goal_amount REAL,
  goal_label TEXT,
  best_run_days INTEGER NOT NULL DEFAULT 0,
  total_clean_days INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS craving_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counter_id INTEGER NOT NULL REFERENCES quit_counters(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  intensity INTEGER NOT NULL,
  trigger TEXT,
  coping_action TEXT,
  resolved INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS relapses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counter_id INTEGER NOT NULL REFERENCES quit_counters(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  trigger TEXT,
  note TEXT,
  run_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mood_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL,
  tag TEXT,
  note TEXT,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('pomodoro','deep','custom')),
  planned_sec INTEGER NOT NULL,
  actual_sec INTEGER,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS body_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight REAL,
  chest REAL,
  waist REAL,
  hips REAL,
  arms REAL,
  legs REAL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  calorie_target INTEGER NOT NULL DEFAULT 2400,
  protein_target INTEGER NOT NULL DEFAULT 150,
  water_ml INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS food_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fat INTEGER NOT NULL DEFAULT 0,
  logged_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cardio_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('run','walk','bike')),
  date TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  distance_km REAL NOT NULL,
  calories INTEGER,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','gps')),
  elevation_gain_m REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cardio_track_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES cardio_sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  altitude REAL,
  accuracy REAL,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cardio_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES cardio_sessions(id) ON DELETE CASCADE,
  km INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS step_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  goal INTEGER NOT NULL DEFAULT 10000,
  source TEXT NOT NULL DEFAULT 'sensor' CHECK (source IN ('sensor','manual')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  weekday INTEGER,
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly')),
  backlog INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  equipment TEXT NOT NULL,
  level TEXT NOT NULL,
  type TEXT NOT NULL,
  cue TEXT NOT NULL,
  errors TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  length_days INTEGER NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(id),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  current_day INTEGER NOT NULL DEFAULT 1,
  completed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, program_id)
);

CREATE TABLE IF NOT EXISTS workout_plan_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  name TEXT NOT NULL,
  exercise_ids TEXT NOT NULL DEFAULT '[]',
  UNIQUE(user_id, weekday)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed','skipped')),
  started_at TEXT,
  finished_at TEXT,
  duration_sec INTEGER,
  feeling INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  order_idx INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS set_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL,
  weight REAL,
  reps INTEGER,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);
`);

// Columns added after the first release — CREATE TABLE IF NOT EXISTS won't add them
// to a database that already exists, so add them explicitly.
function addColumnIfMissing(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing('cardio_sessions', 'source', "TEXT NOT NULL DEFAULT 'manual'");
addColumnIfMissing('cardio_sessions', 'elevation_gain_m', 'REAL');

// Consent record: which document versions the user accepted, and when.
addColumnIfMissing('users', 'terms_version', 'TEXT');
addColumnIfMissing('users', 'privacy_version', 'TEXT');
addColumnIfMissing('users', 'consented_at', 'TEXT');

// Billing scaffolding. Everything is free today; these columns let paid plans be
// switched on later without a migration that touches existing rows.
addColumnIfMissing('users', 'plan', "TEXT NOT NULL DEFAULT 'free'");
addColumnIfMissing('users', 'plan_status', "TEXT NOT NULL DEFAULT 'active'");
addColumnIfMissing('users', 'plan_period_end', 'TEXT');
addColumnIfMissing('users', 'billing_customer_id', 'TEXT');
addColumnIfMissing('users', 'billing_subscription_id', 'TEXT');
addColumnIfMissing('users', 'plan_cancel_at_period_end', 'INTEGER NOT NULL DEFAULT 0');

// Admin + operational visibility.
addColumnIfMissing('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('users', 'status', "TEXT NOT NULL DEFAULT 'active'");
addColumnIfMissing('users', 'last_active_at', 'TEXT');

// Reminder emails. Off by default — nobody is opted into mail they didn't ask for.
addColumnIfMissing('users', 'reminder_email_enabled', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('users', 'reminder_hour', 'INTEGER NOT NULL DEFAULT 19');
addColumnIfMissing('users', 'unsubscribe_token', 'TEXT');
// Date of the last reminder sent, so a restart can't re-send the same day's mail.
addColumnIfMissing('users', 'reminder_last_sent_date', 'TEXT');
// IANA zone, so a reminder hour means the user's local time rather than the server's.
addColumnIfMissing('users', 'timezone', 'TEXT');

/**
 * Cooperative locks so background work runs on exactly one instance. Today the
 * app is single-node, but a second instance would otherwise double-send every
 * reminder — a lock is far cheaper than discovering that in production.
 */
db.exec(`
CREATE TABLE IF NOT EXISTS job_locks (
  name TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
`);

/**
 * Indexes for the queries the app actually runs. Every user-scoped read would
 * otherwise scan the whole table — invisible with one account, linear pain once
 * there are thousands.
 *
 * UNIQUE constraints already create an index, so the pairs they cover
 * (habit_entries(habit_id,date), mood/body/nutrition/step_entries(user_id,date),
 * program_progress, workout_plan_days, users.email, reset tokens) are absent here
 * on purpose — a duplicate index costs writes and buys nothing.
 */
db.exec(`
-- Owner lookups: the single most common filter in the codebase.
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_quit_user ON quit_counters(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_cardio_user ON cardio_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_food_user_date ON food_entries(user_id, date);

-- Focus history filters on the owner and orders by start time.
CREATE INDEX IF NOT EXISTS idx_focus_user_started ON focus_sessions(user_id, started_at);

-- Today's workout is fetched by (user, date) on every Today render.
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, date);

-- Child rows, always read through their parent. cardio_track_points matters
-- most: a single run stores hundreds of points.
CREATE INDEX IF NOT EXISTS idx_track_points_session ON cardio_track_points(session_id);
CREATE INDEX IF NOT EXISTS idx_splits_session ON cardio_splits(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id, order_idx);
CREATE INDEX IF NOT EXISTS idx_set_entries_sx ON set_entries(session_exercise_id, set_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_cravings_counter ON craving_episodes(counter_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_relapses_counter ON relapses(counter_id, timestamp);

-- Unsubscribe links resolve by token alone, from an unauthenticated request.
CREATE INDEX IF NOT EXISTS idx_users_unsubscribe ON users(unsubscribe_token);

-- The reminder sweep runs every 15 minutes and selects opted-in active accounts.
-- Whether each one is actually due depends on their timezone, so that part is
-- decided in code — this index just keeps the sweep from reading every account.
CREATE INDEX IF NOT EXISTS idx_users_reminder
  ON users(reminder_email_enabled, status);

-- Exercise library filtering.
CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises(group_name);
`);
