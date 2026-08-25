import crypto from 'node:crypto';
import { db } from './db.js';

/** Identifies this process in the lock table; useful when reading it by hand. */
const HOLDER = `${process.pid}-${crypto.randomBytes(4).toString('hex')}`;

/**
 * Takes a named lock if it is free or has expired, and returns whether we got it.
 *
 * The whole thing runs inside one transaction so two instances racing on the
 * same tick cannot both see it as free. Locks carry an expiry rather than
 * needing release, so an instance that is killed mid-job does not block the
 * job forever.
 */
export function acquireLock(name: string, ttlMs: number): boolean {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  const take = db.transaction(() => {
    const existing = db.prepare('SELECT holder, expires_at FROM job_locks WHERE name = ?').get(name) as
      | { holder: string; expires_at: string }
      | undefined;

    if (existing && new Date(existing.expires_at) > now && existing.holder !== HOLDER) {
      return false;
    }

    db.prepare(
      `INSERT INTO job_locks (name, holder, acquired_at, expires_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET holder = excluded.holder,
                                       acquired_at = excluded.acquired_at,
                                       expires_at = excluded.expires_at`
    ).run(name, HOLDER, now.toISOString(), expiresAt);
    return true;
  });

  return take();
}

/** Releases a lock we hold. A lock held by someone else is left alone. */
export function releaseLock(name: string): void {
  db.prepare('DELETE FROM job_locks WHERE name = ? AND holder = ?').run(name, HOLDER);
}

/**
 * Runs `fn` only if this instance wins the lock, releasing it afterwards.
 * Returns null when another instance already holds it.
 */
export async function withLock<T>(name: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
  if (!acquireLock(name, ttlMs)) return null;
  try {
    return await fn();
  } finally {
    releaseLock(name);
  }
}

export const lockHolderId = () => HOLDER;
