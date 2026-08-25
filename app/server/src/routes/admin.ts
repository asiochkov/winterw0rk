import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../middleware.js';
import { planOf } from '../entitlements.js';

const router = Router();
router.use(requireAdmin);

/**
 * Operational visibility for the account holder. Deliberately narrow: no
 * password hashes, no reset tokens, and none of the users' journal content —
 * an admin needs to know who signed up and what state their account is in,
 * not to read their mood notes.
 */
const listSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get('/users', (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_query' });
  const { q, limit, offset } = parsed.data;

  const where = q ? 'WHERE email LIKE ?' : '';
  const params = q ? [`%${q.toLowerCase()}%`] : [];

  const total = (db.prepare(`SELECT COUNT(*) n FROM users ${where}`).get(...params) as any).n as number;
  const rows = db
    .prepare(
      `SELECT id, email, name, created_at, status, plan, plan_status, plan_period_end,
              last_active_at, onboarded, is_admin, consented_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  res.json({
    total,
    limit,
    offset,
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name || null,
      createdAt: r.created_at,
      status: r.status,
      plan: planOf(r),
      planStatus: r.plan_status,
      planPeriodEnd: r.plan_period_end,
      lastActiveAt: r.last_active_at,
      onboarded: !!r.onboarded,
      isAdmin: !!r.is_admin,
      consentedAt: r.consented_at,
    })),
  });
});

/** Aggregate counts for a quick health read. */
router.get('/stats', (_req, res) => {
  const one = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as any).n as number;
  res.json({
    totalUsers: one('SELECT COUNT(*) n FROM users'),
    onboardedUsers: one('SELECT COUNT(*) n FROM users WHERE onboarded = 1'),
    activeLast7Days: one("SELECT COUNT(*) n FROM users WHERE last_active_at >= datetime('now', '-7 days')"),
    paidUsers: one("SELECT COUNT(*) n FROM users WHERE plan = 'plus' AND plan_status = 'active'"),
    suspendedUsers: one("SELECT COUNT(*) n FROM users WHERE status != 'active'"),
  });
});

/** Suspend or reinstate an account. Suspension blocks sign-in but keeps the data. */
router.patch('/users/:id/status', (req, res) => {
  const parsed = z.object({ status: z.enum(['active', 'suspended']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const id = Number(req.params.id);
  const target = db.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(id) as any;
  if (!target) return res.status(404).json({ error: 'not_found' });
  if (target.is_admin) return res.status(422).json({ error: 'Admin accounts cannot be suspended here.' });

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(parsed.data.status, id);
  res.json({ ok: true, status: parsed.data.status });
});

export default router;
