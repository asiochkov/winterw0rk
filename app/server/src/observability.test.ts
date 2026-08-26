import { afterAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';

const tmpDb = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ww-obs-')), 'test.db');
process.env.DB_PATH = tmpDb;

const { errorHandler, requestLogger, reportError, setErrorReporter } = await import('./observability.js');
const { createApp } = await import('./app.js');
const request = (await import('supertest')).default;

afterAll(() => {
  setErrorReporter(null);
  fs.rmSync(path.dirname(tmpDb), { recursive: true, force: true });
});

describe('request logging', () => {
  it('gives every response a request id header', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('error handling', () => {
  /** A route that throws, wrapped in the same middleware the real app uses. */
  function appThatThrows() {
    const app = express();
    app.use(requestLogger);
    app.get('/api/boom', () => {
      throw new Error('database on fire');
    });
    app.use(errorHandler);
    return app;
  }

  it('returns an opaque 500 that quotes the request id', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(appThatThrows()).get('/api/boom');
    errors.mockRestore();

    expect(res.status).toBe(500);
    // The detail belongs in the log, not in the response.
    expect(JSON.stringify(res.body)).not.toContain('database on fire');
    // But the id has to match the header, or a user quoting it is useless.
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('hands the error to a registered reporter', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const seen: unknown[] = [];
    setErrorReporter((err) => seen.push(err));

    await request(appThatThrows()).get('/api/boom');
    setErrorReporter(null);
    errors.mockRestore();

    expect(seen).toHaveLength(1);
    expect((seen[0] as Error).message).toBe('database on fire');
  });

  it('survives a reporter that throws', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    setErrorReporter(() => {
      throw new Error('sentry is down');
    });

    // Reporting must not become a second failure on top of the first.
    expect(() => reportError(new Error('original'))).not.toThrow();

    setErrorReporter(null);
    errors.mockRestore();
  });
});
