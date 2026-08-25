# End-to-end tests

Browser-driven checks that run against the real app — a real server, a real
database, and a real Chromium.

## Prerequisites

Start both dev servers first:

```bash
cd ../server && npm run dev     # :8787
cd ../client && npm run dev     # :5173
```

Install Playwright and its browser:

```bash
npm install
npx playwright install chromium
```

If Chromium already lives somewhere else, point at it instead of downloading:

```bash
export CHROMIUM_PATH=/path/to/chromium
```

## Running

```bash
npm run acceptance    # full production acceptance suite
npm run gps           # GPS tracking with emulated device movement
```

`acceptance.mjs` covers registration, consent enforcement, onboarding, every
module (habits, planner, focus, mood, quit, training, nutrition, body, steps),
GDPR export, session persistence across a fresh browser context, user
isolation between two accounts, logout, admin access control, and responsive
layout at mobile/tablet/desktop. It exits non-zero if anything fails.

Screenshots are written to `./shots` (override with `SHOTS_DIR`).
