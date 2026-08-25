import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Point the database at a throwaway file before anything imports db.ts.
const tmpDb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ww-test-')), 'test.db');
process.env.DB_PATH = tmpDb;

const { createApp } = await import('./app.js');
const request = (await import('supertest')).default;

const app = createApp();

/** Signup requires explicit consent; every helper below opts in deliberately. */
const CONSENT = { acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true } as const;

/** Signs up a fresh user and returns an agent that carries their session cookie. */
async function newUser(email = `u${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send({ email, password: 'password123', name: 'T', ...CONSENT });
  expect(res.status).toBe(201);
  return { agent, email };
}

afterAll(() => {
  fs.rmSync(path.dirname(tmpDb), { recursive: true, force: true });
});

describe('auth', () => {
  it('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'short@test.com', password: 'abc', ...CONSENT });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    const email = 'dupe@test.com';
    await request(app).post('/api/auth/signup').send({ email, password: 'password123', ...CONSENT });
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123', ...CONSENT });
    expect(res.status).toBe(409);
  });

  it('rejects a wrong password without revealing which field was wrong', async () => {
    const email = 'wrongpw@test.com';
    await request(app).post('/api/auth/signup').send({ email, password: 'password123', ...CONSENT });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'notthepassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Incorrect email or password.');
  });

  it('gives the same error for an unknown email as for a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Incorrect email or password.');
  });

  it('refuses protected routes without a session', async () => {
    const res = await request(app).get('/api/habits');
    expect(res.status).toBe(401);
  });
});

describe('consent', () => {
  it('refuses signup without accepting the terms', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'noterms@test.com', password: 'password123', acceptedPrivacy: true, confirmedAge: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Terms of Service/i);
  });

  it('refuses signup without accepting the privacy policy', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'nopriv@test.com', password: 'password123', acceptedTerms: true, confirmedAge: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Privacy Policy/i);
  });

  it('refuses signup without an age confirmation', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'noage@test.com', password: 'password123', acceptedTerms: true, acceptedPrivacy: true });
    expect(res.status).toBe(400);
  });

  it('records the accepted versions and reports no outstanding consent', async () => {
    const { agent } = await newUser();
    const me = await agent.get('/api/auth/me');
    expect(me.body.user.needsConsent).toBe(false);
  });

  it('exposes the current document versions publicly', async () => {
    const res = await request(app).get('/api/auth/legal-versions');
    expect(res.status).toBe(200);
    expect(res.body.versions.terms).toBeTruthy();
    expect(res.body.minimumAge).toBeGreaterThanOrEqual(13);
  });
});

describe('account data rights', () => {
  it('exports every category of the user data', async () => {
    const { agent } = await newUser();
    await agent.post('/api/habits').send({ name: 'Reading', type: 'bool', schedule: [0, 1, 2, 3, 4, 5, 6] });
    await agent.post('/api/quit').send({ kind: 'Smoking' });
    await agent.post('/api/mood').send({ mood: 4 });

    const res = await agent.get('/api/account/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment/);

    const data = JSON.parse(res.text);
    expect(data.format).toBe('winterwork.account-export.v1');
    expect(data.account.email).toBeTruthy();
    // The password hash must never leave the server.
    expect(JSON.stringify(data)).not.toMatch(/password_hash/);
    expect(data.habits).toHaveLength(1);
    expect(data.quitCounters).toHaveLength(1);
    expect(data.moodEntries).toHaveLength(1);
    // Every documented collection is present, even when empty.
    for (const key of ['focusSessions', 'bodyEntries', 'cardioSessions', 'stepEntries', 'tasks', 'subtasks']) {
      expect(data).toHaveProperty(key);
    }
  });

  it('deletes the account and cascades to every child row', async () => {
    const { agent, email } = await newUser();
    const me = await agent.get('/api/auth/me');
    const userId = me.body.user.id;

    // Seed rows across several tables, including grandchildren reached only
    // through a join (a habit entry hangs off a habit, not off the user).
    const habit = await agent.post('/api/habits').send({ name: 'Temp', type: 'bool', schedule: [0, 1, 2, 3, 4, 5, 6] });
    await agent.post(`/api/habits/${habit.body.habit.id}/complete`).send({ value: 1 });
    const counter = await agent.post('/api/quit').send({ kind: 'Smoking' });
    await agent.post(`/api/quit/${counter.body.counter.id}/craving`).send({ intensity: 3 });
    await agent.post('/api/mood').send({ mood: 5 });
    await agent.post('/api/steps/sync').send({ steps: 1000 });
    const task = await agent.post('/api/planner').send({ title: 'Temp task', weekday: 0 });
    await agent.post(`/api/planner/${task.body.task.id}/subtasks`).send({ title: 'sub' });

    expect((await agent.delete('/api/auth/me')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password: 'password123' })).status).toBe(401);

    // Erasure must reach the database, not merely revoke access.
    const { db } = await import('./db.js');
    const count = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as any).n as number;

    expect(count('SELECT COUNT(*) n FROM users WHERE id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM habits WHERE user_id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM quit_counters WHERE user_id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM mood_entries WHERE user_id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM step_entries WHERE user_id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM tasks WHERE user_id = ?', userId)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM habit_entries WHERE habit_id = ?', habit.body.habit.id)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM craving_episodes WHERE counter_id = ?', counter.body.counter.id)).toBe(0);
    expect(count('SELECT COUNT(*) n FROM subtasks WHERE task_id = ?', task.body.task.id)).toBe(0);
  });
});

describe('billing entitlements', () => {
  it('reports a free plan with every feature enabled today', async () => {
    const { agent } = await newUser();
    const res = await agent.get('/api/billing/me');
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('free');
    expect(res.body.features).toContain('gps_routes');
    expect(res.body.features).toContain('data_export');
    expect(res.body.checkoutAvailable).toBe(false);
  });

  it('refuses checkout instead of faking a purchase when no provider is configured', async () => {
    const { agent } = await newUser();
    const res = await agent.post('/api/billing/checkout');
    expect(res.status).toBe(503);
    expect(res.body.reason).toBe('billing_provider_not_configured');
  });

  it('downgrades an expired subscription on read', async () => {
    const { agent } = await newUser();
    const me = await agent.get('/api/auth/me');
    const { db } = await import('./db.js');
    db.prepare(
      "UPDATE users SET plan = 'plus', plan_status = 'active', plan_period_end = ? WHERE id = ?"
    ).run(new Date(Date.now() - 86400000).toISOString(), me.body.user.id);

    // Entitlement is derived, so a lapsed period downgrades without a webhook.
    const res = await agent.get('/api/billing/me');
    expect(res.body.plan).toBe('free');
  });

  it('honours a cancelled subscription until its period actually ends', async () => {
    const { agent } = await newUser();
    const me = await agent.get('/api/auth/me');
    const { db } = await import('./db.js');
    db.prepare(
      "UPDATE users SET plan = 'plus', plan_status = 'cancelled', plan_period_end = ? WHERE id = ?"
    ).run(new Date(Date.now() + 7 * 86400000).toISOString(), me.body.user.id);

    const res = await agent.get('/api/billing/me');
    expect(res.body.plan).toBe('plus');
  });

  it('persists the downgrade when restore is called on a lapsed plan', async () => {
    const { agent } = await newUser();
    const me = await agent.get('/api/auth/me');
    const { db } = await import('./db.js');
    db.prepare(
      "UPDATE users SET plan = 'plus', plan_status = 'active', plan_period_end = ? WHERE id = ?"
    ).run(new Date(Date.now() - 86400000).toISOString(), me.body.user.id);

    const res = await agent.post('/api/billing/restore');
    expect(res.body.plan).toBe('free');
    const row = db.prepare('SELECT plan_status FROM users WHERE id = ?').get(me.body.user.id) as any;
    expect(row.plan_status).toBe('expired');
  });
});

describe('admin', () => {
  async function makeAdmin(email: string) {
    const { db } = await import('./db.js');
    db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);
  }

  it('hides the admin surface from ordinary accounts', async () => {
    const { agent } = await newUser();
    // 404 rather than 403 so the endpoint's existence is not advertised.
    expect((await agent.get('/api/admin/users')).status).toBe(404);
    expect((await agent.get('/api/admin/stats')).status).toBe(404);
  });

  it('refuses admin routes when signed out', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(404);
  });

  it('lists accounts for an admin without exposing credentials', async () => {
    const { agent, email } = await newUser();
    await makeAdmin(email);

    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toMatch(/\$2[aby]\$/); // no bcrypt hashes

    const self = res.body.users.find((u: any) => u.email === email);
    expect(self).toBeTruthy();
    expect(self.id).toBeTruthy();
    expect(self.createdAt).toBeTruthy();
    expect(self.status).toBe('active');
    expect(self.plan).toBe('free');
  });

  it('reports aggregate stats', async () => {
    const { agent, email } = await newUser();
    await makeAdmin(email);
    const res = await agent.get('/api/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('activeLast7Days');
  });

  it('suspends an account and blocks its sign-in', async () => {
    const admin = await newUser();
    await makeAdmin(admin.email);
    const victim = await newUser();
    const victimId = (await victim.agent.get('/api/auth/me')).body.user.id;

    const res = await admin.agent.patch(`/api/admin/users/${victimId}/status`).send({ status: 'suspended' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: victim.email, password: 'password123' });
    expect(login.status).toBe(403);

    // And can be reinstated.
    await admin.agent.patch(`/api/admin/users/${victimId}/status`).send({ status: 'active' });
    const retry = await request(app)
      .post('/api/auth/login')
      .send({ email: victim.email, password: 'password123' });
    expect(retry.status).toBe(200);
  });

  it('will not let an admin suspend another admin', async () => {
    const a = await newUser();
    const b = await newUser();
    await makeAdmin(a.email);
    await makeAdmin(b.email);
    const bId = (await b.agent.get('/api/auth/me')).body.user.id;

    const res = await a.agent.patch(`/api/admin/users/${bId}/status`).send({ status: 'suspended' });
    expect(res.status).toBe(422);
  });
});

describe('steps', () => {
  it('starts at zero and accumulates sensor syncs', async () => {
    const { agent } = await newUser();
    expect((await agent.get('/api/steps/today')).body.entry.steps).toBe(0);

    await agent.post('/api/steps/sync').send({ steps: 1200, source: 'sensor' });
    const res = await agent.post('/api/steps/sync').send({ steps: 3400, source: 'sensor' });
    expect(res.body.entry.steps).toBe(3400);
  });

  it('never lets a sensor resync lower the day count', async () => {
    const { agent } = await newUser();
    await agent.post('/api/steps/sync').send({ steps: 5000, source: 'sensor' });
    // A page reload restarts the on-device counter; this must not erase progress.
    const res = await agent.post('/api/steps/sync').send({ steps: 12, source: 'sensor' });
    expect(res.body.entry.steps).toBe(5000);
  });

  it('allows a manual correction downward', async () => {
    const { agent } = await newUser();
    await agent.post('/api/steps/sync').send({ steps: 9000, source: 'sensor' });
    const res = await agent.post('/api/steps/sync').send({ steps: 200, source: 'manual' });
    expect(res.body.entry.steps).toBe(200);
    expect(res.body.entry.source).toBe('manual');
  });

  it('updates the daily goal', async () => {
    const { agent } = await newUser();
    const res = await agent.patch('/api/steps/goal').send({ goal: 12000 });
    expect(res.body.entry.goal).toBe(12000);
  });

  it('rejects an absurd goal', async () => {
    const { agent } = await newUser();
    expect((await agent.patch('/api/steps/goal').send({ goal: 5 })).status).toBe(400);
  });
});

describe('password reset', () => {
  it('does not reveal whether an email is registered', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.devResetToken).toBeUndefined();
  });

  it('resets the password and invalidates the token afterwards', async () => {
    const email = 'reset@test.com';
    await request(app).post('/api/auth/signup').send({ email, password: 'password123', ...CONSENT });

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    const token = forgot.body.devResetToken;
    expect(token).toBeTruthy();

    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'brandnewpass' });
    expect(reset.status).toBe(200);

    // Old password no longer works, new one does.
    expect((await request(app).post('/api/auth/login').send({ email, password: 'password123' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email, password: 'brandnewpass' })).status).toBe(200);

    // The same token cannot be replayed.
    const replay = await request(app).post('/api/auth/reset-password').send({ token, password: 'thirdpassword' });
    expect(replay.status).toBe(400);
  });

  it('rejects an unknown token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'nope', password: 'password123' });
    expect(res.status).toBe(400);
  });
});

describe('habits', () => {
  it('creates a habit and marks it complete', async () => {
    const { agent } = await newUser();
    const created = await agent
      .post('/api/habits')
      .send({ name: 'Cold Shower', type: 'bool', schedule: [0, 1, 2, 3, 4, 5, 6] });
    expect(created.status).toBe(201);
    expect(created.body.habit.doneToday).toBe(false);

    const done = await agent.post(`/api/habits/${created.body.habit.id}/complete`).send({ value: 1 });
    expect(done.status).toBe(200);
    expect(done.body.habit.doneToday).toBe(true);
    expect(done.body.habit.streak).toBe(1);
  });

  it('will not let one user touch another account habit', async () => {
    const owner = await newUser();
    const intruder = await newUser();
    const created = await owner.agent
      .post('/api/habits')
      .send({ name: 'Private', type: 'bool', schedule: [0, 1, 2, 3, 4, 5, 6] });

    const id = created.body.habit.id;
    expect((await intruder.agent.get(`/api/habits/${id}`)).status).toBe(404);
    expect((await intruder.agent.post(`/api/habits/${id}/complete`).send({ value: 1 })).status).toBe(404);
    expect((await intruder.agent.delete(`/api/habits/${id}`)).status).toBe(404);
  });
});

describe('quit counters', () => {
  it('keeps totals and best run when a relapse is logged', async () => {
    const { agent } = await newUser();
    const created = await agent.post('/api/quit').send({ kind: 'Smoking', unitCost: 0.5, dailyAmount: 10 });
    expect(created.status).toBe(201);
    const id = created.body.counter.id;
    expect(created.body.counter.attempts).toBe(1);

    const relapsed = await agent.post(`/api/quit/${id}/relapse`).send({ trigger: 'Stress' });
    expect(relapsed.status).toBe(200);

    const c = relapsed.body.counter;
    // A relapse starts a new run but must never erase the history.
    expect(c.runDays).toBe(0);
    expect(c.attempts).toBe(2);
    expect(c.bestRunDays).toBeGreaterThanOrEqual(0);
    expect(c.totalCleanDays).toBeGreaterThanOrEqual(0);

    const detail = await agent.get(`/api/quit/${id}`);
    expect(detail.body.relapses).toHaveLength(1);
    expect(detail.body.relapses[0].trigger).toBe('Stress');
  });

  it('records craving episodes', async () => {
    const { agent } = await newUser();
    const created = await agent.post('/api/quit').send({ kind: 'Sugar' });
    const id = created.body.counter.id;

    await agent.post(`/api/quit/${id}/craving`).send({ intensity: 4, trigger: 'Boredom', copingAction: 'Short walk' });
    const detail = await agent.get(`/api/quit/${id}`);
    expect(detail.body.cravings).toHaveLength(1);
    expect(detail.body.cravings[0].intensity).toBe(4);
  });

  it('rejects an out-of-range craving intensity', async () => {
    const { agent } = await newUser();
    const created = await agent.post('/api/quit').send({ kind: 'Vaping' });
    const res = await agent.post(`/api/quit/${created.body.counter.id}/craving`).send({ intensity: 9 });
    expect(res.status).toBe(400);
  });
});

describe('training', () => {
  it('logs sets and detects a personal record on the first session', async () => {
    const { agent } = await newUser();
    const today = await agent.get('/api/training/today');
    expect(today.status).toBe(200);
    if (today.body.restDay) return; // seeded plan does not cover every weekday

    const session = today.body.session;
    await agent.post(`/api/training/sessions/${session.id}/start`);
    const first = session.exercises[0];

    await agent
      .post(`/api/training/sessions/${session.id}/sets`)
      .send({ sessionExerciseId: first.sessionExerciseId, weight: 60, reps: 8, isWarmup: false });

    const finished = await agent.post(`/api/training/sessions/${session.id}/finish`).send({ feeling: 4 });
    expect(finished.status).toBe(200);
    expect(finished.body.summary.tonnage).toBe(480);
    expect(finished.body.summary.setCount).toBe(1);
    expect(finished.body.summary.prs).toHaveLength(1);
  });

  it('excludes warm-up sets from tonnage', async () => {
    const { agent } = await newUser();
    const today = await agent.get('/api/training/today');
    if (today.body.restDay) return;

    const session = today.body.session;
    await agent.post(`/api/training/sessions/${session.id}/start`);
    const first = session.exercises[0];

    await agent
      .post(`/api/training/sessions/${session.id}/sets`)
      .send({ sessionExerciseId: first.sessionExerciseId, weight: 20, reps: 10, isWarmup: true });
    await agent
      .post(`/api/training/sessions/${session.id}/sets`)
      .send({ sessionExerciseId: first.sessionExerciseId, weight: 50, reps: 5, isWarmup: false });

    const finished = await agent.post(`/api/training/sessions/${session.id}/finish`).send({});
    expect(finished.body.summary.setCount).toBe(1);
    expect(finished.body.summary.tonnage).toBe(250);
  });
});

describe('street / cardio', () => {
  it('derives distance from a GPS track rather than trusting the client', async () => {
    const { agent } = await newUser();
    const degPerMetre = 1 / 111195;
    const start = Date.parse('2026-01-01T06:00:00.000Z');
    // 111 points 10 m apart ≈ 1.10 km — comfortably past the 1 km mark so exactly
    // one split is expected. (A nominal 1000 m measures ~999 m by haversine and
    // would legitimately produce no split at all.)
    const points = Array.from({ length: 111 }, (_, i) => ({
      lat: 55.75 + i * 10 * degPerMetre,
      lon: 37.62,
      accuracy: 8,
      recordedAt: new Date(start + i * 4000).toISOString(), // 2.5 m/s
    }));

    const res = await agent.post('/api/street').send({ mode: 'run', durationSec: 440, points });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe('gps');
    expect(res.body.distanceKm).toBeCloseTo(1.1, 1);
    expect(res.body.splits).toHaveLength(1);
    // 1 km at 2.5 m/s = 400 s.
    expect(res.body.splits[0].durationSec).toBeCloseTo(400, -1);
  });

  it('accepts a manual distance when no track is supplied', async () => {
    const { agent } = await newUser();
    const res = await agent.post('/api/street').send({ mode: 'walk', durationSec: 1800, distanceKm: 4.4 });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe('manual');
    expect(res.body.distanceKm).toBe(4.4);
  });

  it('requires either a track or a distance', async () => {
    const { agent } = await newUser();
    const res = await agent.post('/api/street').send({ mode: 'run', durationSec: 600 });
    expect(res.status).toBe(400);
  });

  it('rejects a track where every point is unusable', async () => {
    const { agent } = await newUser();
    const points = [
      { lat: 55.75, lon: 37.62, accuracy: 900, recordedAt: '2026-01-01T06:00:00.000Z' },
      { lat: 55.76, lon: 37.62, accuracy: 900, recordedAt: '2026-01-01T06:00:30.000Z' },
    ];
    const res = await agent.post('/api/street').send({ mode: 'run', durationSec: 30, points });
    expect(res.status).toBe(422);
  });
});

describe('planner', () => {
  it('creates, completes and deletes a task', async () => {
    const { agent } = await newUser();
    const created = await agent.post('/api/planner').send({ title: 'Buy groceries', weekday: 0 });
    expect(created.status).toBe(201);
    const id = created.body.task.id;

    const updated = await agent.patch(`/api/planner/${id}`).send({ done: true });
    expect(updated.body.task.done).toBe(true);

    expect((await agent.delete(`/api/planner/${id}`)).status).toBe(200);
    const list = await agent.get('/api/planner');
    expect(list.body.tasks.find((t: any) => t.id === id)).toBeUndefined();
  });

  it('moves a task to the backlog', async () => {
    const { agent } = await newUser();
    const created = await agent.post('/api/planner').send({ title: 'Someday', weekday: 2 });
    const moved = await agent.patch(`/api/planner/${created.body.task.id}`).send({ backlog: true, weekday: null });
    expect(moved.body.task.backlog).toBe(true);
  });
});

describe('notification preferences', () => {
  it('defaults to off and persists an opt-in', async () => {
    const { agent } = await newUser();

    const initial = await agent.get('/api/account/notifications');
    expect(initial.body.reminderEmailEnabled).toBe(false);

    const saved = await agent
      .patch('/api/account/notifications')
      .send({ reminderEmailEnabled: true, reminderHour: 7 });
    expect(saved.body).toMatchObject({ reminderEmailEnabled: true, reminderHour: 7 });

    const reread = await agent.get('/api/account/notifications');
    expect(reread.body).toMatchObject({ reminderEmailEnabled: true, reminderHour: 7 });
  });

  it('rejects an out-of-range hour', async () => {
    const { agent } = await newUser();
    const res = await agent.patch('/api/account/notifications').send({ reminderHour: 24 });
    expect(res.status).toBe(400);
  });

  it('requires a session', async () => {
    expect((await request(app).get('/api/account/notifications')).status).toBe(401);
  });

  it('unsubscribes via the emailed token without a session', async () => {
    const { agent } = await newUser();
    await agent.patch('/api/account/notifications').send({ reminderEmailEnabled: true });

    const { db } = await import('./db.js');
    const me = await agent.get('/api/auth/me');
    const row = db
      .prepare('SELECT unsubscribe_token FROM users WHERE id = ?')
      .get(me.body.user.id) as { unsubscribe_token: string };
    expect(row.unsubscribe_token).toBeTruthy();

    // No agent — an email link carries no cookie.
    const res = await request(app).get(`/api/account/unsubscribe?token=${row.unsubscribe_token}`);
    expect(res.status).toBe(200);

    const after = await agent.get('/api/account/notifications');
    expect(after.body.reminderEmailEnabled).toBe(false);
  });

  it('does not error on a bogus unsubscribe token', async () => {
    expect((await request(app).get('/api/account/unsubscribe?token=nope')).status).toBe(200);
  });
});

describe('reminder sweep', () => {
  it('counts only scheduled, incomplete habits for today', async () => {
    const { agent } = await newUser();
    const { openHabitsToday } = await import('./reminders.js');
    const { todayStr, weekdayOf } = await import('./util.js');

    const today = todayStr();
    const me = await agent.get('/api/auth/me');
    const userId = me.body.user.id;

    // One scheduled for today, one scheduled for a different day.
    const scheduled = await agent
      .post('/api/habits')
      .send({ name: 'Today habit', type: 'bool', schedule: [weekdayOf(today)] });
    await agent
      .post('/api/habits')
      .send({ name: 'Other day', type: 'bool', schedule: [(weekdayOf(today) + 1) % 7] });

    expect(openHabitsToday(userId, today)).toEqual({ remaining: 1, total: 1 });

    await agent.post(`/api/habits/${scheduled.body.habit.id}/complete`).send({ value: 1 });
    expect(openHabitsToday(userId, today)).toEqual({ remaining: 0, total: 1 });
  });

  it('sends nothing when no mail transport is configured', async () => {
    const { runReminderSweep } = await import('./reminders.js');
    await expect(runReminderSweep()).resolves.toEqual({ sent: 0, skipped: 0 });
  });
});

describe('reminder timezones', () => {
  it('reads the local hour and date for a zone, not the server clock', async () => {
    const { localHourAndDate } = await import('./reminders.js');
    // 2026-08-25T22:30Z is already the 26th in Tokyo and still the 25th in New York.
    const instant = new Date('2026-08-25T22:30:00Z');

    expect(localHourAndDate(instant, 'UTC')).toEqual({ hour: 22, date: '2026-08-25' });
    expect(localHourAndDate(instant, 'Asia/Tokyo')).toEqual({ hour: 7, date: '2026-08-26' });
    expect(localHourAndDate(instant, 'America/New_York')).toEqual({ hour: 18, date: '2026-08-25' });
  });

  it('reports midnight as hour 0, not 24', async () => {
    const { localHourAndDate } = await import('./reminders.js');
    expect(localHourAndDate(new Date('2026-08-25T00:15:00Z'), 'UTC').hour).toBe(0);
  });

  it('falls back to server time for a missing or bogus zone', async () => {
    const { localHourAndDate } = await import('./reminders.js');
    const instant = new Date('2026-08-25T22:30:00Z');
    const fallback = { hour: instant.getHours(), date: expect.any(String) };
    expect(localHourAndDate(instant, null)).toMatchObject(fallback);
    expect(localHourAndDate(instant, 'Not/AZone')).toMatchObject(fallback);
  });

  it('stores a valid timezone at signup and rejects a bogus one', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/signup')
      .send({ email: `tz${Date.now()}@test.com`, password: 'password123', timezone: 'Europe/Moscow', ...CONSENT });
    expect((await agent.get('/api/account/notifications')).body.timezone).toBe('Europe/Moscow');

    const junk = request.agent(app);
    await junk
      .post('/api/auth/signup')
      .send({ email: `tzx${Date.now()}@test.com`, password: 'password123', timezone: 'Mars/Olympus', ...CONSENT });
    expect((await junk.get('/api/account/notifications')).body.timezone).toBeNull();
  });

  it('changes the timezone from settings but ignores an unknown one', async () => {
    const { agent } = await newUser();
    const ok = await agent.patch('/api/account/notifications').send({ timezone: 'Asia/Tokyo' });
    expect(ok.body.timezone).toBe('Asia/Tokyo');

    const bad = await agent.patch('/api/account/notifications').send({ timezone: 'Nope/Nope' });
    expect(bad.body.timezone).toBe('Asia/Tokyo');
  });
});

describe('job locks', () => {
  it('lets only one holder in at a time and frees on release', async () => {
    const { acquireLock, releaseLock } = await import('./joblock.js');
    expect(acquireLock('t-basic', 60_000)).toBe(true);
    releaseLock('t-basic');
    expect(acquireLock('t-basic', 60_000)).toBe(true);
    releaseLock('t-basic');
  });

  it('hands the lock over once it has expired', async () => {
    const { acquireLock } = await import('./joblock.js');
    const { db } = await import('./db.js');
    expect(acquireLock('t-expiry', 60_000)).toBe(true);

    // Pretend another instance took it and then died holding it.
    db.prepare("UPDATE job_locks SET holder = 'someone-else', expires_at = ? WHERE name = 't-expiry'").run(
      new Date(Date.now() - 1000).toISOString()
    );
    expect(acquireLock('t-expiry', 60_000)).toBe(true);
  });

  it('refuses a lock another live instance holds', async () => {
    const { acquireLock } = await import('./joblock.js');
    const { db } = await import('./db.js');
    acquireLock('t-contended', 60_000);
    db.prepare("UPDATE job_locks SET holder = 'other-instance' WHERE name = 't-contended'").run();
    expect(acquireLock('t-contended', 60_000)).toBe(false);
  });

  it('withLock skips the body when the lock is held elsewhere', async () => {
    const { acquireLock, withLock } = await import('./joblock.js');
    const { db } = await import('./db.js');
    acquireLock('t-skip', 60_000);
    db.prepare("UPDATE job_locks SET holder = 'other-instance' WHERE name = 't-skip'").run();

    let ran = false;
    const result = await withLock('t-skip', 60_000, async () => {
      ran = true;
      return 'done';
    });
    expect(ran).toBe(false);
    expect(result).toBeNull();
  });

  it('releases the lock even when the job throws', async () => {
    const { acquireLock, withLock } = await import('./joblock.js');
    await expect(
      withLock('t-throws', 60_000, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    // Free again for the next run rather than stuck until the TTL.
    expect(acquireLock('t-throws', 60_000)).toBe(true);
  });
});
