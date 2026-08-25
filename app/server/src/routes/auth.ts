import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, setSessionUser, userIdOf } from '../middleware.js';
import { ensureDefaultPlan } from '../seedData.js';
import { LEGAL_VERSIONS, MINIMUM_AGE } from '../legal.js';
import { config } from '../config.js';
import { passwordResetMail, sendMail } from '../mailer.js';

const router = Router();

const credsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().trim().max(80).optional(),
});

const signupSchema = credsSchema.extend({
  acceptedTerms: z.literal(true, { message: 'You must accept the Terms of Service to create an account.' }),
  acceptedPrivacy: z.literal(true, { message: 'You must accept the Privacy Policy to create an account.' }),
  confirmedAge: z.literal(true, { message: `You must confirm you are at least ${MINIMUM_AGE}.` }),
});

export function toPublicUser(row: any) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    goal: row.goal,
    areas: JSON.parse(row.areas || '[]'),
    arcStartDate: row.arc_start_date,
    arcLengthDays: row.arc_length_days,
    onboarded: !!row.onboarded,
    plan: row.plan ?? 'free',
    planStatus: row.plan_status ?? 'active',
    planPeriodEnd: row.plan_period_end ?? null,
    isAdmin: !!row.is_admin,
    status: row.status ?? 'active',
    // True when the accepted documents are older than the ones now in force,
    // so the client knows to ask for consent again.
    needsConsent: row.terms_version !== LEGAL_VERSIONS.terms || row.privacy_version !== LEGAL_VERSIONS.privacy,
  };
}

router.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  }
  const { email, password, name } = parsed.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, terms_version, privacy_version, consented_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(email, hash, name || '', LEGAL_VERSIONS.terms, LEGAL_VERSIONS.privacy);
  ensureDefaultPlan(Number(info.lastInsertRowid));
  setSessionUser(req, Number(info.lastInsertRowid));
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: toPublicUser(row) });
});

/** Re-accepting after the documents change. */
router.post('/consent', requireAuth, (req, res) => {
  const schema = z.object({ acceptedTerms: z.literal(true), acceptedPrivacy: z.literal(true) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Both documents must be accepted.' });

  db.prepare(
    "UPDATE users SET terms_version = ?, privacy_version = ?, consented_at = datetime('now') WHERE id = ?"
  ).run(LEGAL_VERSIONS.terms, LEGAL_VERSIONS.privacy, userIdOf(req));

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdOf(req));
  res.json({ user: toPublicUser(row) });
});

router.get('/legal-versions', (_req, res) => {
  res.json({ versions: LEGAL_VERSIONS, minimumAge: MINIMUM_AGE });
});

router.post('/login', (req, res) => {
  const parsed = credsSchema.omit({ name: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Enter a valid email and password.' });
  }
  const { email, password } = parsed.data;
  const row: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (row.status !== 'active') {
    return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  }
  setSessionUser(req, row.id);
  res.json({ user: toPublicUser(row) });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.delete('/me', requireAuth, (req, res) => {
  const userId = userIdOf(req);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  req.session = null;
  res.json({ ok: true });
});

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });

router.post('/forgot-password', async (req, res, next) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email.' });
  const email = parsed.data.email;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;

  if (!user) {
    // Don't reveal whether the account exists.
    return res.json({ ok: true });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id,
    token,
    expiresAt
  );

  const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

  try {
    const sent = await sendMail(passwordResetMail(email, resetUrl));
    // Only hand the token back when nothing could deliver it, so a configured
    // deployment never leaks a working reset token over the API.
    res.json(sent ? { ok: true } : { ok: true, devResetToken: token });
  } catch (err) {
    next(err);
  }
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

router.post('/reset-password', (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  }
  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(parsed.data.token) as any;
  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  const hash = bcrypt.hashSync(parsed.data.password, 10);
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?').run(row.user_id);
  });
  tx();

  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userIdOf(req));
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ user: toPublicUser(row) });
});

const onboardingSchema = z.object({
  goal: z.string().min(1),
  areas: z.array(z.string()).default([]),
  habits: z
    .array(
      z.object({
        name: z.string().min(1),
        category: z.string().default('GENERAL'),
        type: z.enum(['bool', 'count', 'time']).default('bool'),
        target: z.number().optional(),
        unit: z.string().optional(),
        step: z.number().optional(),
        schedule: z.array(z.number()).default([0, 1, 2, 3, 4, 5, 6]),
      })
    )
    .min(1, 'Pick at least one habit to start with.'),
});

router.post('/onboarding', requireAuth, (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'invalid_input' });
  }
  const { goal, areas, habits } = parsed.data;
  const userId = userIdOf(req);
  const today = new Date().toISOString().slice(0, 10);

  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE users SET goal = ?, areas = ?, arc_start_date = ?, onboarded = 1 WHERE id = ?'
    ).run(goal, JSON.stringify(areas), today, userId);

    const insertHabit = db.prepare(
      `INSERT INTO habits (user_id, name, type, category, schedule, target, unit, step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const h of habits) {
      insertHabit.run(
        userId,
        h.name,
        h.type,
        h.category,
        JSON.stringify(h.schedule),
        h.target ?? null,
        h.unit ?? null,
        h.step ?? null
      );
    }
  });
  tx();

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ user: toPublicUser(row) });
});

export default router;
