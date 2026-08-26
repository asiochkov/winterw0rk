# Winterwork

Habit, quit, mood, focus and training tracker. React + TypeScript client,
Express + SQLite API, real accounts and real persistence.

Built from the Claude Design prototype in `../project/Winterwork v7.dc.html`.

## Running locally

```bash
# terminal 1 — API on :8787
cd server && npm install && npm run dev

# terminal 2 — client on :5173 (proxies /api to the server)
cd client && npm install && npm run dev
```

Sign up, accept the terms, complete onboarding. A default 3-day/week training
plan and your chosen habits are seeded so Today has real content immediately.

## Tests

```bash
cd server && npm test        # 104 unit + API integration tests
cd e2e && node acceptance.mjs # 32 browser checks against the running app
```

The e2e suite covers the full new-user journey, session persistence across a
fresh browser, user isolation between two accounts, admin access control, and
responsive layout. See `e2e/README.md`.

## Architecture

```
server/src
  app.ts          express app factory (importable for tests)
  db.ts           schema + additive column migrations
  config.ts       env config; refuses insecure defaults in production
  security.ts     rate limiting and security headers
  observability.ts structured request log, error reporting seam
  backup.ts       scheduled SQLite snapshots with retention
  joblock.ts      expiring DB locks so background jobs run once
  middleware.ts   requireAuth / requireAdmin / activity tracking
  entitlements.ts plan -> feature mapping (single place to gate features)
  geo.ts          GPS distance, splits, elevation, noise filtering
  streak.ts       habit streak / consistency calculation
  routes/         one module per product area
client/src
  screens/        one file per screen
  components/     Shell (nav), ui primitives, states, ErrorBoundary
  context/        auth + language
  hooks/          useAsyncData, useGeoTracker, usePedometer
  i18n/           full EN + RU dictionaries
  legal/          versioned Terms and Privacy documents
```

## Accounts and data

Real bcrypt-hashed passwords, HTTP-only session cookies (30 days), full
password reset with single-use expiring tokens. Every user-scoped query filters
by `user_id`; cross-account access is covered by tests. Account deletion
cascades to every table — also test-verified.

### Admin

There is no way to make yourself an admin through the API. Grant it server-side:

```bash
cd server && npm run grant-admin -- you@example.com
```

Admins then see an "Admin" section in Settings, and `/admin` lists accounts
(id, email, joined, status, plan, last active) with search, suspend and
reinstate. Admin routes answer 404 to everyone else so the surface is not
advertised. Password hashes are never returned.

## Subscriptions

The foundation is in place and everything is currently free — matching the
brief. `entitlements.ts` maps plan → features; `planOf()` derives the effective
plan server-side and expires a lapsed subscription on read, so a missed webhook
cannot leave someone entitled forever. Statuses model active / cancelled /
expired / past_due, and a cancelled plan keeps access until its paid period
ends.

No payment provider is configured, so `POST /api/billing/checkout` returns 503
rather than faking a purchase. Wiring a real provider means implementing
checkout-session creation, a signed webhook that writes
`plan` / `plan_status` / `plan_period_end`, and refresh-on-restore. Nothing else
in the app needs to change.

## Legal and privacy

Versioned Terms of Service and Privacy Policy in EN and RU (`/terms`,
`/privacy`). Signup requires three separate, unticked confirmations, and the
accepted version is stored per user — bumping a version re-prompts on next
sign-in. Settings offers a complete JSON export of the account (right to
portability) and immediate deletion. One strictly necessary session cookie,
plus language in localStorage; no analytics or advertising trackers, disclosed
in a dismissible notice.

## Configuration

See `.env.example`. Production refuses to start without `SESSION_SECRET`, so a
public deployment cannot ship with a forgeable session key.

`SMTP_HOST` is optional. Without it the app runs in a reduced mode: sign-up and
sign-in work as always, self-service password reset is closed (the operator
runs `npm run reset-password` instead), and reminder emails are off. It cannot
be left half-open, because delivering a reset token without email would mean
returning it over the API. See "Running without email" in `DEPLOY.md`.

The client build refuses in the same spirit: `VITE_LEGAL_OPERATOR_NAME`,
`VITE_LEGAL_OPERATOR_LOCATION` and `VITE_LEGAL_CONTACT_EMAIL` name who operates
the service, and the Privacy Policy is legally required to say so. A production
build with those unset fails rather than shipping a policy that names nobody.

## Deploying

The image builds the client, compiles the server, and serves both from one
origin — no CORS, no separate static host.

`render.yaml` deploys the whole thing on Render's free tier with no card and no
configuration — but free instances there have no disk, so the database is lost
on every restart. Fine for a demo, not for real accounts. `DEPLOY.md` covers
that and the options that keep data.

```bash
cp .env.example .env      # fill in SESSION_SECRET, APP_URL, SMTP_*
docker compose up -d --build
```

SQLite lives on the `winterwork-data` volume, so it survives container
replacement. The app snapshots it on a schedule into `backups/` beside the
database, keeping the newest few — see the Backups section of `DEPLOY.md` for
restoring, and for why you still want a copy off the box.

Notes:

- The container runs as a non-root user and exposes `/api/health` for probes.
- `SIGTERM` drains in-flight requests, closes idle keep-alive sockets and
  closes the database before exit, so deploys don't truncate a write.
- Hashed assets are served immutable; `index.html` is `no-cache`, so a deploy
  doesn't leave clients on a stale bundle.
- Behind a reverse proxy, terminate TLS there and forward to port 8787.
  `trust proxy` is on in production so rate limiting keys on the real client IP.

## Email

Password resets and daily reminders send over SMTP via `SMTP_*`. Reset links
are built from `APP_URL`, so it must be the public URL.

In development without SMTP nothing is silently dropped: mail is logged to the
console and the reset link is returned to the UI with a visible note. That
convenience is development-only — in production the token is never returned
over the API, and the endpoint closes instead.

Reminder emails are opt-in per user in Settings, only sent on days something is
still open, sent at most once a day, and carry an unsubscribe link that works
without a login.

## Device features

- **GPS** (Street): real `watchPosition` tracking. Distance, km splits and
  elevation are recomputed server-side from the raw track, so the stored result
  cannot be spoofed. Poor-accuracy points and impossible jumps are filtered.
  Transient signal loss keeps recording; only a permission refusal stops it.
  Declining permission falls back to manual distance entry.
- **Pedometer** (Steps): accelerometer peak detection with a refractory period
  and hysteresis. Raw sensor data never leaves the device — only the step total
  is synced, and a resync can never lower the day's count. Manual entry is
  available where no motion sensor exists.

## Scaling

`SCALING.md` covers where this shape stops working, in the order you will hit
it, and what to change at each point.

## Known limitations

- **Single-instance only.** SQLite is a single-writer store on one disk, so a
  second instance would corrupt data — `fly scale count 2` is not an option.
  Background jobs are already safe to run in more than one process (they take
  an expiring DB lock), but rate-limit counters are still per-process. Moving
  to Postgres is the unlock; see `SCALING.md`.
- **Email reminders only.** No web push or native notifications, and none at
  all on a deployment with no SMTP.
- **One theme.** The interface is dark by design, matching the prototype; it
  does not follow the operating system's light mode.
- **No billing integration.** Plan state is modelled and enforced, but there is
  no payment provider wired up; everything is free.
- Exercise, program and food seed content is representative (36 exercises
  across all muscle groups), not exhaustive.
