const isProd = process.env.NODE_ENV === 'production';

/**
 * Fail fast rather than booting production with a known-public default secret,
 * which would let anyone forge a session cookie.
 */
function requiredInProduction(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (isProd) {
    throw new Error(
      `${name} must be set in production. Refusing to start with an insecure default.`
    );
  }
  return devFallback;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

const smtpHost = optional('SMTP_HOST');

/**
 * Email is only "configured" when we have somewhere to send through. Without it
 * the app still works — reset links surface in the dev UI instead — but
 * production refuses to boot, because a silently-undeliverable password reset
 * locks real users out of their accounts.
 */
const smtp = smtpHost
  ? {
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      // Port 465 is implicit TLS; everything else upgrades via STARTTLS.
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      user: optional('SMTP_USER'),
      pass: optional('SMTP_PASS'),
    }
  : undefined;

/**
 * Running production without SMTP is a deliberate, reduced mode, not an error:
 * a launch can be worth more than self-service password reset. What it must
 * never become is a security hole, so with no mailer the reset endpoint is
 * closed outright rather than handing the token back over the API — that would
 * let anyone take over any account by knowing its email address.
 *
 * The operator resets passwords by hand instead: `npm run reset-password`.
 */
if (isProd && !smtp) {
  console.warn(
    [
      '',
      '  ┌─────────────────────────────────────────────────────────────┐',
      '  │  Running WITHOUT email (SMTP_HOST is not set).              │',
      '  │                                                             │',
      '  │  · Sign-up and sign-in work normally.                       │',
      '  │  · Self-service password reset is DISABLED. Anyone who      │',
      '  │    forgets their password needs you to reset it:            │',
      '  │        npm run reset-password -- them@example.com           │',
      '  │  · Daily reminder emails are not sent.                      │',
      '  │                                                             │',
      '  │  Set SMTP_HOST to turn all of this back on.                 │',
      '  └─────────────────────────────────────────────────────────────┘',
      '',
    ].join('\n')
  );
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || 8787,
  sessionSecret: requiredInProduction('SESSION_SECRET', 'winterwork-dev-secret-not-for-production'),

  /** Absolute base URL used to build links inside emails. */
  appUrl: (optional('APP_URL') || `http://localhost:${Number(process.env.PORT) || 8787}`).replace(/\/$/, ''),

  smtp,
  mailFrom: optional('MAIL_FROM') || 'Winterwork <no-reply@winterwork.app>',

  /** Directory the built client is served from in production. */
  clientDir: optional('CLIENT_DIR'),

  /** Send the daily reminder sweep at this hour, server local time. */
  reminderHour: Number(process.env.REMINDER_HOUR) || 19,
  remindersEnabled: process.env.REMINDERS_ENABLED !== 'false',

  backupsEnabled: process.env.BACKUPS_ENABLED !== 'false',
  /** Where snapshots are written. Defaults to a `backups` dir beside the DB. */
  backupDir: optional('BACKUP_DIR'),
  /** How many snapshots to keep; older ones are pruned after each run. */
  backupKeep: Number(process.env.BACKUP_KEEP) || 7,
  backupIntervalHours: Number(process.env.BACKUP_INTERVAL_HOURS) || 24,
} as const;
