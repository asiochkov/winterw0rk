import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { db, dbPath } from './db.js';
import { config } from './config.js';
import { withLock } from './joblock.js';
import { log, reportError } from './observability.js';

/**
 * Point-in-time snapshots of the database.
 *
 * Copying the file with `cp` is not safe here: the app runs in WAL mode, so a
 * plain copy can catch a checkpoint mid-flight and produce a file that opens
 * but is missing recent commits. SQLite's own backup API takes a consistent
 * snapshot of a live database instead.
 *
 * These snapshots sit on the same disk as the database, which protects against
 * the likely failures — a bad migration, a mistaken delete, corruption — but
 * not against losing the volume itself. Copying them off-box is a separate job;
 * see SCALING.md.
 */

const PREFIX = 'winterwork-';
const SUFFIX = '.db';

export function backupDir(): string {
  return config.backupDir || path.join(path.dirname(dbPath), 'backups');
}

/** Colons and dots are legal in a filename but awkward everywhere else. */
function stamp(now: Date): string {
  return now.toISOString().replace(/[:.]/g, '-');
}

/**
 * Writes one snapshot and prunes old ones. Returns the file written and how
 * many were removed.
 */
export async function runBackup(now = new Date()): Promise<{ file: string; pruned: number }> {
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${PREFIX}${stamp(now)}${SUFFIX}`);
  // Write under a temporary name and rename on success: a rename is atomic, so
  // a crash mid-backup can never leave a half-written file that looks complete.
  const tmp = `${file}.partial`;
  try {
    await db.backup(tmp);
    // The copy inherits WAL mode, which means part of it can live in a `-wal`
    // sidecar — so "the backup" would be three files, and copying only the .db
    // off-box would silently lose the newest commits. Switching the snapshot to
    // rollback journalling checkpoints the WAL into it and deletes the sidecar,
    // leaving one self-contained file that restores by being copied into place.
    const snapshot = new Database(tmp);
    try {
      snapshot.pragma('journal_mode = DELETE');
    } finally {
      snapshot.close();
    }
    fs.renameSync(tmp, file);
  } catch (err) {
    for (const ext of ['', '-wal', '-shm']) fs.rmSync(tmp + ext, { force: true });
    throw err;
  }

  return { file, pruned: prune() };
}

/** Deletes all but the newest `backupKeep` snapshots. */
export function prune(): number {
  const dir = backupDir();
  let names: string[];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return 0;
  }

  // Names are ISO-stamped, so lexical order is chronological order.
  const snapshots = names.filter((n) => n.startsWith(PREFIX) && n.endsWith(SUFFIX)).sort();
  const doomed = snapshots.slice(0, Math.max(0, snapshots.length - config.backupKeep));
  for (const name of doomed) {
    // Opening a snapshot in WAL mode leaves `-wal` and `-shm` beside it. They
    // have to go with their database: a stale `-wal` left next to a name that
    // a later snapshot reuses would be replayed into it on open.
    for (const ext of ['', '-wal', '-shm']) {
      fs.rmSync(path.join(dir, name + ext), { force: true });
    }
  }
  return doomed.length;
}

let timer: NodeJS.Timeout | null = null;

/**
 * Runs a backup on boot and then on the configured interval. The lock keeps
 * two instances from writing snapshots on top of each other; its TTL is short
 * of the interval so a crashed holder frees it before the next run.
 */
export function startBackupScheduler(): void {
  if (timer || !config.backupsEnabled) return;
  const intervalMs = config.backupIntervalHours * 60 * 60 * 1000;

  const tick = () => {
    withLock('backup', Math.min(intervalMs / 2, 30 * 60 * 1000), async () => {
      const { file, pruned } = await runBackup();
      log('info', { msg: 'backup', file: path.basename(file), pruned });
    }).catch((err) => reportError(err, { msg: 'backup failed' }));
  };

  timer = setInterval(tick, intervalMs);
  timer.unref?.();
  tick();
}

export function stopBackupScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
