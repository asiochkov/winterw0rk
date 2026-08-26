import express from 'express';
import cookieSession from 'cookie-session';
import path from 'node:path';
import './db.js';
import { ensureExercisesSeeded, ensureProgramsSeeded } from './seedData.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import quitRoutes from './routes/quit.js';
import trainingRoutes from './routes/training.js';
import moodRoutes from './routes/mood.js';
import focusRoutes from './routes/focus.js';
import exerciseRoutes from './routes/exercises.js';
import programRoutes from './routes/programs.js';
import bodyRoutes from './routes/body.js';
import nutritionRoutes from './routes/nutrition.js';
import streetRoutes from './routes/street.js';
import plannerRoutes from './routes/planner.js';
import stepRoutes from './routes/steps.js';
import accountRoutes from './routes/account.js';
import billingRoutes from './routes/billing.js';
import adminRoutes from './routes/admin.js';
import { rateLimit, securityHeaders } from './security.js';
import { errorHandler, requestLogger } from './observability.js';
import { trackActivity } from './middleware.js';
import { config } from './config.js';
import { mailerConfigured } from './mailer.js';

export function createApp() {
  ensureExercisesSeeded();
  ensureProgramsSeeded();

  const app = express();
  const isProd = config.isProd;

  // Needed for correct req.ip behind a reverse proxy, which the rate limiter keys on.
  if (isProd) app.set('trust proxy', 1);

  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(express.json({ limit: '2mb' }));
  app.use(
    cookieSession({
      name: 'ww_session',
      keys: [config.sessionSecret],
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: isProd,
      httpOnly: true,
    })
  );

  // CORS for the Vite dev server. In production the client is served from the
  // same origin, so no cross-origin allowance is granted.
  if (!isProd) {
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });
  }

  // Credential endpoints are the ones worth brute-forcing, so they get a tighter
  // limit than the rest of the API. Tests disable it to stay deterministic.
  if (process.env.NODE_ENV !== 'test') {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: 'Too many attempts. Wait a few minutes and try again.',
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/signup', authLimiter);
    app.use('/api/auth/forgot-password', authLimiter);
    app.use('/api/auth/reset-password', authLimiter);

    app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 600 }));
  }

  app.use('/api', trackActivity);

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/quit', quitRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/mood', moodRoutes);
  app.use('/api/focus', focusRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/programs', programRoutes);
  app.use('/api/body', bodyRoutes);
  app.use('/api/nutrition', nutritionRoutes);
  app.use('/api/street', streetRoutes);
  app.use('/api/planner', plannerRoutes);
  app.use('/api/steps', stepRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/billing', billingRoutes);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // What this deployment can actually do, so the client stops offering things
  // that will fail. Public and unauthenticated: the sign-in screen needs it
  // before anyone has an account.
  app.get('/api/config', (_req, res) =>
    res.json({
      // Outside production the flow still works: it hands the reset link back
      // to the UI instead of mailing it.
      passwordResetEnabled: mailerConfigured() || !config.isProd,
      reminderEmailsEnabled: mailerConfigured() && config.remindersEnabled,
    })
  );

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

  // In production the built client is served from this same origin, which is
  // why no CORS allowance is granted above.
  if (config.clientDir) {
    const indexHtml = path.join(config.clientDir, 'index.html');

    // Hashed build assets are safe to cache hard; index.html must not be, or
    // clients keep booting a stale bundle after a deploy.
    app.use(
      express.static(config.clientDir, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath === indexHtml) res.setHeader('Cache-Control', 'no-cache');
          else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );

    // SPA fallback: client-side routes like /today are not files on disk.
    // Sets its own cache header because this path bypasses express.static.
    app.get(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);

  return app;
}
