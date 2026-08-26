import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Production with no SMTP is a supported mode, so the thing that makes it
 * supportable needs a test: sign-up and sign-in keep working, and the reset
 * endpoint closes rather than handing a token to whoever asks.
 */
const tmpDb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ww-nomail-')), 'test.db');
process.env.DB_PATH = tmpDb;
process.env.NODE_ENV = 'production';
process.env.SESSION_SECRET = 'test-secret-not-a-real-one';
delete process.env.SMTP_HOST;

const { createApp } = await import('./app.js');
const request = (await import('supertest')).default;
const app = createApp();

const CONSENT = { acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true } as const;

afterAll(() => {
  fs.rmSync(path.dirname(tmpDb), { recursive: true, force: true });
});

describe('production without email', () => {
  it('boots and reports password reset as unavailable', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.passwordResetEnabled).toBe(false);
    expect(res.body.reminderEmailsEnabled).toBe(false);
  });

  it('still lets someone sign up and sign in', async () => {
    const email = 'nomail@test.com';
    const agent = request.agent(app);

    const signup = await agent
      .post('/api/auth/signup')
      .set('X-Forwarded-Proto', 'https')
      .send({ email, password: 'password123', name: 'No Mail', ...CONSENT });
    expect(signup.status).toBe(201);

    const login = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .send({ email, password: 'password123' });
    expect(login.status).toBe(200);
  });

  it('refuses password reset instead of leaking a usable token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .set('X-Forwarded-Proto', 'https')
      .send({ email: 'nomail@test.com' });

    expect(res.status).toBe(503);
    // The whole point: nothing in the response may be a working reset token.
    expect(JSON.stringify(res.body)).not.toMatch(/[0-9a-f]{32}/);
  });
});
