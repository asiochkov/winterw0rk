# Winterwork

A habit, quitting, mood, focus and training tracker. Real accounts, real
persistence, RU and EN.

**The app lives in [`app/`](app/) — start with [`app/README.md`](app/README.md).**

```bash
cd app/server && npm install && npm run dev    # API on :8787
cd app/client && npm install && npm run dev    # client on :5173
```

| I want to… | Read |
| --- | --- |
| Run it locally, understand the architecture | [`app/README.md`](app/README.md) |
| Put it on the internet | [`app/DEPLOY.md`](app/DEPLOY.md) |
| Know what breaks as it grows | [`app/SCALING.md`](app/SCALING.md) |

## What else is in here

- `project/` — the original Claude Design prototypes the app was built from.
  `Winterwork v7.dc.html` is the one that was implemented.
- `chats/` — the design conversations behind those prototypes.
- `tools/build-prototype-bundle.mjs` — packs the prototype into a shareable
  static folder and a single self-contained HTML file, with React and Babel
  vendored so it depends on nothing at runtime.
- `HANDOFF.md` — the original Claude Design handoff instructions, kept for
  provenance.
