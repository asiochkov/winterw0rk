# Winterwork — where this is and what happens next

Written to hand the work to a fresh session. Read this before touching anything.

## The one thing to get right

The app is being rebuilt to match a design prototype **exactly**. Nothing here
is a design brief — the design is finished and lives in the repo. The job is to
transfer it, not to improve it. When a choice comes up between "this would look
better" and "this is what the prototype does", the prototype wins every time.

**The reference is `project/Winterwork v7.dc.html`.** Not v6, not v5.

This was contested, and the reasoning matters, because everything in the repo
that predates the decision argues the other way.

`CLAUDE_TASK.md` (the brief) names v7 as the source of truth and says that when
the current site and v7 disagree, v7 wins. But its own palette section forbids
any colour outside a list that **appears nowhere in v7**:

| token the brief mandates | in v6 | in v7 |
| --- | --- | --- |
| `#080B0F` `#0D1117` `#121820` `#17202A` `#1C2631` `#8FD8FF` `#6FCB9A` | all seven | none |

v7 runs on its own palette instead — `#0D0D0D`, `#121214`, `#1B1B1E`,
`#7E9BFF`, `#63C79B` — and `04_DESIGN_TOKENS.json` is the older pack that v6
implements. So the brief contradicts itself: it was measured against v7 (it
cites 6548 lines, which is v7's exact length; v6 is 6117) but quotes the pack's
palette without re-checking.

**The owner resolved it: follow v7 in full, palette included.** The brief's
palette section is void. Do not "restore" the ice-blue values from the pack.

The cost was accepted knowingly: all 25 screens differ between v6 and v7, so
the eleven screens transferred from v6 (see the table below) have to be
transcribed again from v7. Some differ in content, not just colour — v6's
Session summary has three cards, v7's has five.

## What is in the repo (no ZIP needed)

The contents of `Winterwork mobile app prototype (8).zip` are already committed:

- `project/Winterwork v7.dc.html` — the reference. Read it with a script, not
  by eye.
- `project/Winterwork v6.dc.html`, `v5.dc.html` — earlier iterations. v6 is the
  one that implements the design pack's tokens; keep it for reference, do not
  transfer from it.
- `project/support.js`, `project/image-slot.js` — the runtime the prototype needs.
- `project/uploads/Winterwork_FINAL_DESIGN_PACK/` — `01_product_inventory.json`,
  `03_UI/04_DESIGN_TOKENS.json`, `03_UI/current_tokens.json`, the UX documents,
  screenshots, and every uploaded asset.
- `project/uploads/Winterwork_MOTION_ONLY_PACK/` — motion tokens.

## How to see the reference running

The prototype is not static: it pulls React, ReactDOM and Babel from unpkg, and
its runtime re-fetches its own URL and re-parses it. Both have to be handled.

```bash
node tools/build-prototype-bundle.mjs   # vendors the libraries from npm
cd dist/prototype && python3 -m http.server 8097
```

The bundler builds **v7**. `PROTOTYPE='Winterwork v6.dc.html' node
tools/build-prototype-bundle.mjs` builds the other one when you need to
compare the two.

The quickest way to a given screen is not clicking: the prototype restores its
whole state from `localStorage['winterwork.v6']` — v7 kept v6's storage key —
so `app/e2e/prototype-screen.mjs`
seeds the screen and its figures and screenshots it. The seed has to go in
through `addInitScript` — set it after the first load and the prototype's own
debounced save writes `screen: 'today'` back over it.

Then drive it with Playwright (`/opt/pw-browsers/chromium`, `--no-sandbox`).
Its bottom navigation is the widest row of same-height `<button>` elements —
**not** the lowest row on the page, because the design canvas puts its own
chrome below the phone frame. Group buttons by rounded y and take the biggest
group. Clicking those five tabs walks the screens.

If the page renders its own source instead of the app, set
`window.__resources = {}` before `support.js` runs — that stops the re-fetch.
`tools/build-prototype-bundle.mjs` already does this.

## How the app is compared against it

```bash
cd app/client && npm run build
cd ../server && npm run build
```

Run the server in production with a TLS proxy in front — session cookies are
`Secure`, so plain HTTP will not keep anyone signed in:

```bash
NODE_ENV=production PORT=8796 BACKUPS_ENABLED=false \
  DB_PATH=/tmp/cmp/w.db CLIENT_DIR=$PWD/../client/dist \
  SESSION_SECRET=$(openssl rand -hex 32) node dist/index.js
```

A ~15-line Node HTTPS proxy that forwards with `x-forwarded-proto: https` is
enough; Playwright connects with `ignoreHTTPSErrors: true`.

**Seed the comparison account** or half the screens have nothing to show:

```bash
cd app/server && npm run seed-demo -- demo@winterwork.test
```

It writes the prototype's own figures — nine habits with four closed, counters
at 23/9/2 days clean, a session planned for today, arc day 17 of 90.

## Done so far

| Commit | What |
| --- | --- |
| `57e8075` | Tokens moved from v7 to v6, both palettes, day theme values added |
| `3e1e02c` | Bottom navigation rebuilt: world switch, 50 original icons, sliding pill |
| `58cbefb` | Today — arc hero, next step, streak card |
| `d7884a5` | Seed script; week strip fixed to v6's 60% rule |
| `3d1a2f8` | Today — habits card with category pods, block reordering |
| `c3202bd` | Progress screen built from nothing, with a server endpoint |
| `817cd4f` | Habits list rebuilt; quit moved behind a segmented control |
| `e9b2bc8` | Habit detail rebuilt |
| `87e6863` | Quit counter rebuilt, milestone table carried over with its source |
| `00edaaf` | Training screen rebuilt |
| `29d66c1` | Active session rebuilt |
| `d9f07e7` | Session summary built (from v6 — needs redoing against v7) |
| `d3c6021` | Reference switched to v7; tokens rewritten from v7 |
| _this one_ | Divergence report (brief step 2) |

Everything is on `main` at `github.com/asiochkov/winterw0rk`. Render redeploys
on push; the live URL is `winterwork.onrender.com`.

## Still to do

**Start from `docs/divergence.md`** — regenerate it with `node
tools/divergence-report.mjs`. It lists all 25 v7 screens against what the app
has: nine transcribed from v6 and needing redoing, fourteen never transcribed
from any prototype at all, two with no screen yet.

**First: re-transcribe the v6 screens against v7.** The token swap changed
every colour under them, but their layout and content are still v6's.

Screens not yet built: **Exercise / Library / Plans / Program detail**, Focus and Focus history, Mood,
Street, Nutrition, Planner, Welcome / Sign in / Create account / Forgot
password, Onboarding and Fitness setup, Profile and Settings.

Cross-cutting: the More sheet with its command palette, the quick-action menu
behind the plus button, the rail navigation for tablet and desktop, empty /
loading / error states, the prototype's motion (directional screen
transitions, the nav
icon pop, press scales, the plus rotating 45°), the day theme wired to a
toggle, and the free-plan gating the prototype shows (Today's habit card
capped at three,
programs behind a paywall).

Then: automate the screenshot comparison as a regression check, and run the
final screen-by-screen audit against the live deployment rather than a local
build.

## Things that will bite you

- **`habit.week` is a rolling seven days ending today**, not a Monday-first
  week. Labelling cells by array position mislabels every one of them.
- **A day with nothing scheduled is not a failed day.** Rest days are excluded
  from the consistency rate and drawn as stubs, in both the Progress sparkline
  and the Today week strip.
- **A day is held at 60% of what was due**, not 100%. `arcWeek` is
  byte-identical in v6 and v7, so this survived the switch.
- **`--sunk` equals `--bg` in the night palette.** Tiles painted with it look
  flat on purpose. Do not "fix" them.
- **The i18n dictionaries are large and already hold keys like `quitSaved`,
  `trainingExercises`, `trainingLastTime`.** Adding a duplicate key fails the
  build with TS1117 — check before adding.
- **Uppercase comes from CSS, not the dictionaries.** The prototype sets
  labels in caps;
  the dictionaries hold sentence case.
- **Never invent design values.** Extract them from the prototype with a script
  and copy them. Every stylesheet added so far says where its numbers came from.
- **Check which prototype the bundler is serving before you trust a
  screenshot.** It builds v7 now. If a screen renders with cards its markup
  does not have, you are looking at the wrong version.
- **The design pack and the brief's palette section describe v6, not v7.** They
  are not the reference. See the top of this file.
- **Assets are extracted, not redrawn.** `app/client/src/assets/icons.v6.json`
  holds the prototype's 50 icon paths — verified byte-identical in v6 and v7,
  so the v6 in its name is now only history; `milestones.v6.json` holds its recovery
  table with the CDC attribution and the not-medical disclaimer intact.

## Working rhythm that has been holding

Extract the markup for one screen from v7 → transcribe its measurements into
CSS with a comment saying so → wire it to real data → render it in Playwright →
read the screenshot → fix what is wrong → run `npm test` in `app/server`
(104 tests) → commit → push. Render picks it up.

Small, verifiable steps. Every bug found so far — the week labels, the 60%
rule, the clipped bottom nav, the duplicated craving button, the squat in an
upper-body session — came from looking at a rendered screenshot, not from
reasoning about the code.
