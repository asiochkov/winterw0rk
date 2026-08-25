# End-to-end tests

Browser-driven checks that run against the real app — a real server, a real
database, and a real Chromium.

## Prerequisites

Start both dev servers first:

```bash
cd ../server && npm run dev     # :8787
cd ../client && npm run dev     # :5173
```

Playwright must be available. If Chromium lives outside the default location,
point at it explicitly:

```bash
export CHROMIUM_PATH=/path/to/chromium
```

## Running

```bash
node acceptance.mjs   # full production acceptance suite
node gps.mjs          # GPS tracking with emulated device movement
```

`acceptance.mjs` covers registration, consent enforcement, onboarding, every
module (habits, planner, focus, mood, quit, training, nutrition, body, steps),
GDPR export, session persistence across a fresh browser context, user
isolation between two accounts, logout, admin access control, and responsive
layout at mobile/tablet/desktop. It exits non-zero if anything fails.

Screenshots are written to `./shots` (override with `SHOTS_DIR`).
