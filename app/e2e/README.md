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

## Comparing a screen against the v6 prototype

`prototype-screen.mjs` screenshots one screen of the design prototype, so an
app screen can be put next to the thing it is being transferred from.

```bash
node ../../tools/build-prototype-bundle.mjs
(cd ../../dist/prototype && python3 -m http.server 8097) &
node prototype-screen.mjs ssummary /tmp/ssummary.png '{"sumSets":6,"sumTon":1832}'
```

The third argument seeds v6's own state, so a screen can be shown with the same
figures the app is showing. The bundler builds v6 by default — the reference
CONTINUE.md settles on; set `PROTOTYPE='Winterwork v7.dc.html'` to look at
another version deliberately.
