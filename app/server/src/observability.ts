import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

/**
 * Request logging and error reporting.
 *
 * Logs go to stdout as one JSON object per line, because that is what every
 * host and log shipper already understands — `fly logs`, Docker, journald — and
 * it stays greppable without a collector. Development gets a short human line
 * instead, since nobody reads JSON in a terminal by choice.
 *
 * Nothing user-entered is logged. Paths are reduced to their route shape and
 * the user is identified by id, never by email: server logs are the one place
 * that quietly accumulates data nobody consented to, and this app stores
 * health records.
 */

export interface ErrorReporter {
  (err: unknown, context: Record<string, unknown>): void;
}

let reporter: ErrorReporter | null = null;

/**
 * Registers an external error sink (Sentry, GlitchTip, anything). Deliberately
 * a seam rather than a dependency: nothing here needs a vendor SDK, and adding
 * one to send a stack trace is a poor trade until there is traffic to justify
 * it. Call this from index.ts once you have a DSN.
 */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn;
}

export function reportError(err: unknown, context: Record<string, unknown> = {}): void {
  log('error', { ...context, err: describe(err) });
  try {
    reporter?.(err, context);
  } catch (reporterErr) {
    // A broken reporter must never take down the request that hit the error.
    console.error('[observability] error reporter threw:', reporterErr);
  }
}

function describe(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  return { message: String(err) };
}

export function log(level: 'info' | 'warn' | 'error', fields: Record<string, unknown>): void {
  const line: Record<string, unknown> = { level, time: new Date().toISOString(), ...fields };
  const out = level === 'error' ? console.error : console.log;
  if (config.isProd) {
    out(JSON.stringify(line));
  } else {
    const { time: _time, err, ...rest } = line;
    out(
      `[${level}]`,
      Object.entries(rest)
        .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(' '),
      err ? `\n${(err as { stack?: string }).stack ?? (err as { message: string }).message}` : ''
    );
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Correlates the access log line, any error report, and the 500 response. */
    id?: string;
  }
}

/**
 * Collapses a concrete path to the route that served it, so that `/api/habits/1`
 * and `/api/habits/2` aggregate instead of producing one distinct log key per
 * row in the database.
 */
function routeShape(req: Request): string {
  const base = req.baseUrl || '';
  // Express 5 exposes a RegExp here for regex routes such as the SPA fallback;
  // only a literal path is worth reporting as the route.
  const path = (req.route as { path?: unknown } | undefined)?.path;
  const route = typeof path === 'string' ? path : undefined;
  if (route && route !== '/') return `${base}${route}`;
  if (route === '/') return base || '/';
  // Unmatched (404, static, SPA fallback) — keep the prefix, drop the specifics.
  // req.path is relative to the mount, so the mount has to be added back.
  const full = `${base}${req.path}`;
  return full.startsWith('/api') ? `${full.split('/').slice(0, 3).join('/')}/*` : '/*';
}

/**
 * One line per request, after the response is done so it can carry the status
 * and duration. Health checks are dropped: they arrive every 30 seconds and
 * would be most of the log.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    if (req.path === '/api/health') return;
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    log(res.statusCode >= 500 ? 'error' : 'info', {
      msg: 'request',
      id: req.id,
      method: req.method,
      route: routeShape(req),
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
      user: (req.session as { userId?: number } | undefined)?.userId ?? null,
    });
  });

  next();
}

/**
 * Last resort for anything a route threw. The response carries the request id
 * so a user can quote it and it can be found in the log, without exposing what
 * actually failed.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  reportError(err, {
    msg: 'unhandled',
    id: req.id,
    method: req.method,
    route: routeShape(req),
    user: (req.session as { userId?: number } | undefined)?.userId ?? null,
  });

  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong. Try again.', requestId: req.id });
}

/**
 * Crash-level handlers. An uncaught exception leaves the process in an unknown
 * state, so it is reported and then the process exits for the supervisor to
 * replace; a rejected promise is reported but survivable.
 */
export function installProcessHandlers(onFatal: () => void): void {
  process.on('unhandledRejection', (reason) => {
    reportError(reason, { msg: 'unhandledRejection' });
  });
  process.on('uncaughtException', (err) => {
    reportError(err, { msg: 'uncaughtException', fatal: true });
    onFatal();
  });
}
