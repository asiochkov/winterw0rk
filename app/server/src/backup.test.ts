import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ww-backup-'));
const backupDir = path.join(tmpRoot, 'snapshots');

// The module reads DB_PATH and BACKUP_* at import time, so set them first.
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.BACKUP_DIR = backupDir;
process.env.BACKUP_KEEP = '3';

const { db } = await import('./db.js');
const { runBackup, prune } = await import('./backup.js');

beforeAll(() => {
  db.prepare(
    "INSERT INTO users (email, password_hash, name) VALUES ('backup@example.com', 'x', 'Backup')"
  ).run();
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('backup', () => {
  it('writes a snapshot that opens and still holds the data', async () => {
    const { file } = await runBackup();
    expect(fs.existsSync(file)).toBe(true);

    // The point of a backup is that it can be read back, so read it back.
    const restored = new Database(file, { readonly: true });
    const row = restored
      .prepare('SELECT email FROM users WHERE email = ?')
      .get('backup@example.com') as { email: string } | undefined;
    restored.close();
    expect(row?.email).toBe('backup@example.com');
  });

  it('leaves no partial file behind', async () => {
    await runBackup(new Date(Date.now() + 1000));
    const partials = fs.readdirSync(backupDir).filter((n) => n.endsWith('.partial'));
    expect(partials).toEqual([]);
  });

  it('keeps only the newest snapshots, sidecars included', () => {
    // Older stamped names, deliberately not created in chronological order,
    // one of them carrying the WAL sidecars an open would leave behind.
    for (const day of ['05', '01', '04', '02', '03']) {
      fs.writeFileSync(path.join(backupDir, `winterwork-2026-01-${day}T00-00-00-000Z.db`), '');
    }
    fs.writeFileSync(path.join(backupDir, 'winterwork-2026-01-01T00-00-00-000Z.db-wal'), '');
    fs.writeFileSync(path.join(backupDir, 'winterwork-2026-01-01T00-00-00-000Z.db-shm'), '');

    expect(prune()).toBe(4);

    const left = fs.readdirSync(backupDir).sort();
    // Three snapshots, and no sidecar outliving the database it belonged to.
    expect(left.filter((n) => n.endsWith('.db'))).toHaveLength(3);
    expect(left.filter((n) => n.endsWith('-wal') || n.endsWith('-shm'))).toEqual([]);
    // Pruning goes by timestamp: the January leftovers are the oldest, so the
    // two snapshots taken above must have survived.
    expect(left.filter((n) => n.startsWith('winterwork-2026-01'))).toEqual([
      'winterwork-2026-01-05T00-00-00-000Z.db',
    ]);
  });
});
