# Winterwork — UX/UI audit and work plan

Every finding below was measured against the running production build, not
read off the code. The sweep that produced the numbers is
`app/e2e/sweep.mjs` — it walks each route at 390px and 1440px and reports
overflow, touch targets under 44px, off-screen elements and page errors.

Priorities: **P0** blocks a key task · **P1** serious friction · **P2**
noticeable · **P3** polish.

---

## The conflict this audit sits on

The repo's standing instruction (`CONTINUE.md`, `CLAUDE_TASK.md`) is to
transfer `Winterwork v7.dc.html` pixel for pixel and never invent design
values. The audit brief asks the opposite: judge the product, fix what is
wrong, do not copy references mechanically.

They are not reconcilable as written, so this audit separates them:

- **Where v7 is silent, the audit decides.** Loading, error and empty states,
  touch target sizes, focus rings, keyboard behaviour, form validation and
  double-submit guards are absent from the prototype — it has no network and
  no failures. Nothing is lost by fixing them well.
- **Where v7 has a design, v7 wins on look** — spacing, type, colour, radii —
  **but not on behaviour it never had to have.**
- **Where v7's own design causes a real usability problem**, the finding says
  so explicitly and states what was chosen instead, so the deviation is
  visible rather than smuggled in.

Nothing below silently overrides the prototype.

---

## P0 — blocks a key task

### P0-1 · A failed action is invisible
26 of the 46 awaited API calls sit in files with no `catch` anywhere:
`Body`, `Focus`, `Mood`, `Nutrition`, `Planner`, `Programs`, `Steps`,
`QuitDetail`. React error boundaries do not catch rejected promises, so a
failed request left the screen exactly as it was.

Worst case, `Focus`: pressing Start called `api.post('/focus/start')` bare. On
failure nothing happened at all — no timer, no error, no clue whether the tap
registered. `finish()` was worse: it set `running = false` before awaiting, so
a failed save stopped the clock and stranded the session.

**Fixed.** A toast now exists (transcribed from v7's own `flash()`, which the
app never had), `useMutation` flashes failures and blocks double submits, and
Focus keeps the session open on a failed finish so stopping again retries.

### P0-2 · Nineteen screens have no loading or error state — **fixed**
27 screens fetch; 8 have a loading state, 7 have an error state. On the rest a
slow network shows an empty screen indistinguishable from "you have no data",
and a failure shows the same. `useAsyncData` already existed and solved this —
it was used by 3 screens out of 38.

**Fixed** by adopting the existing hooks. No file is left with a bare
`await api.*` and no guard. Three of the failures were worse than silence:

- `Nutrition.addFood`, `Body.save`, `Planner.addTask` and
  `Planner.addSubtask` cleared their inputs *before* the request resolved, so
  a failure threw away what the user had typed.
- `QuitDetail.finishCraving` showed the "you got through it" state before the
  post returned, congratulating the user on an episode that was never saved.
- `Mood.save` cleared its pending flag only on success, so a failed save left
  the chip stuck mid-press.
- `Steps.startCounting` read `entry.steps` from a load that could reject, and
  its periodic sync produced an unhandled rejection every few seconds. The
  background sync now fails quietly and reports once when the user stops —
  the total is cumulative, so nothing is lost.

### P0-3 · The desktop layout reserves a column nothing fills
`.app-rail` is 300px wide at ≥1180px and **no screen passes `rail`**. On a
1440px laptop the content column is 780px pinned left of ~300px of dead black.
That is why the laptop build reads as broken.

v7 fills it with `CTX` — a per-screen context panel ("DAY CONTEXT / Where you
stand") whose metrics compare against the user's own 30-day average.

**Plan:** build the context rail from v7's `CTX`, starting with Today.

---

## P1 — serious friction

### P1-1 · Touch targets below 44px on the phone
Measured at 390px:

| target | size | where |
| --- | --- | --- |
| world tabs (Discipline / Fitness) | 123×34 | every tabbed screen |
| More, Quick action | 40×40 | every tabbed screen |
| habits counter "4 / 9" | 26×11 | Today |
| "View history" | 110×16 | Focus |
| "Browse exercise library" | 208×16 | Training |
| mode chips (Pomodoro / Deep Work / Custom) | 114×41 | Focus |
| segmented tabs (Week / Backlog, Overview / Habits) | 175×41 | Planner, Progress |
| "Open" | 59×40 | Training |

v7 specifies the 34px and 40px heights, so the visual stays; the **hit area**
is extended to 44px instead. Text links get real padding.

### P1-2 · Sign-up is unfinished
The first screen a new user meets:
- raw browser checkboxes, three of them, ~13px each, against a fully custom UI
  everywhere else;
- the primary CTA sits disabled-grey until all three are ticked, with nothing
  saying why, so the screen reads as broken on arrival;
- `<h1 style={{ fontSize: 26 }}>` — an inline override, off the type scale and
  far below v7's auth display type;
- every server error ("that email already exists") renders under the
  **password** field, because `error` is passed to that `Field`;
- no password reveal, so a typo can only be found by failing.

### P1-3 · Today's lower blocks are invisible — **fixed**
Mood and Focus are buttons filled with `--sunk` and given no border, straight
from v7. That works in v7's day palette, where `--sunk` (#EFF0F5) sits above
`--bg` (#FAFAFA). In the night palette the two are the same colour, so two
buttons disappeared into the page between two bordered cards.

This is the case this audit reserved for itself: v7's own design causing a
real problem. **Deviation, deliberate and minimal** — the fill stays v7's, so
the tiles keep their recessive weight and the day theme is untouched, and a
hairline `--edge` gives them something to be seen by.

---

## P2 — noticeable

- **P2-1** No route-level pending state: navigating renders the new screen's
  empty shell before its data lands, so every transition flashes.
- **P2-2** No form is focused on mount; sign-in needs a tap before typing.
- **P2-3** `ExerciseLibrary`, `AddHabit`, `AddQuit`, `Profile`, `ResetPassword`
  and `ForgotPassword` have no loading, error or empty state at all.
- **P2-4** The habits counter "4 / 9" is a link but is not styled as one.

## P3 — polish

- **P3-1** No focus-visible ring is defined anywhere; keyboard users cannot
  see where they are.
- **P3-2** `prefers-reduced-motion` is honoured in two stylesheets out of
  sixteen.
- **P3-3** The hero reserves ~350px on desktop with nothing in it.

---

## Order of work

1. P0-1 feedback on failure — **done**
2. P0-2 loading and error states — **done**
3. P0-3 the desktop context rail — **done for Today**, other screens pending
4. P1-1 touch targets — **done**
5. P1-2 sign-up — **done**
6. P1-3 Today's lower blocks — **done**
7. P2, then P3 — pending
