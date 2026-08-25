import type { NextFunction, Request, Response } from 'express';
import { db } from './db.js';

/**
 * Populated by requireAuth. Handlers behind that middleware can rely on
 * `req.userId` being present without casting.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/** Signs the given user in for subsequent requests. */
export function setSessionUser(req: Request, userId: number) {
  if (req.session) (req.session as { userId?: number }).userId = userId;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as { userId?: number } | null | undefined)?.userId;
  if (!userId) return res.status(401).json({ error: 'not_authenticated' });
  req.userId = userId;
  next();
}

/** Narrowing helper for handlers mounted behind requireAuth. */
export function userIdOf(req: Request): number {
  if (req.userId == null) throw new Error('userIdOf called outside an authenticated route');
  return req.userId;
}

/**
 * Admin-only routes. Deliberately returns 404 rather than 403 so the existence
 * of the admin surface is not advertised to ordinary accounts.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as { userId?: number } | null | undefined)?.userId;
  if (!userId) return res.status(404).json({ error: 'not_found' });

  const row = db.prepare('SELECT is_admin, status FROM users WHERE id = ?').get(userId) as
    | { is_admin: number; status: string }
    | undefined;
  if (!row || !row.is_admin || row.status !== 'active') {
    return res.status(404).json({ error: 'not_found' });
  }
  req.userId = userId;
  next();
}

/**
 * Records that the account did something today. Written at most once per day per
 * user so a busy session does not turn every request into a write.
 */
const lastActivityWrites = new Map<number, string>();

export function trackActivity(req: Request, _res: Response, next: NextFunction) {
  const userId = (req.session as { userId?: number } | null | undefined)?.userId;
  if (userId) {
    const today = new Date().toISOString().slice(0, 10);
    if (lastActivityWrites.get(userId) !== today) {
      lastActivityWrites.set(userId, today);
      db.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(userId);
    }
  }
  next();
}
