# WINTERWORK — AUTONOMOUS PRODUCT DESIGN COMMAND

You are the lead product designer, UX architect, design-systems designer and interaction designer responsible for the complete redesign of Winterwork.

This is NOT a request for suggestions, a moodboard, a list of improvements, or a cosmetic reskin.

Your task is to **produce the finished Winterwork design solution** inside Claude Design.

Do the design thinking yourself. Do not ask the user to decide obvious design questions. Make strong, expert decisions and self-review them before presenting the result.

---

# 0. READ THE ENTIRE PACK FIRST

Before generating the first screen, inspect all supplied project files and references.

Required reading:
- `01_SOURCE/Winterwork v6.dc.html`
- `01_SOURCE/01_product_inventory.json`
- all files under `02_UX`
- all files under `03_UI`
- all visual references under `04_REFERENCES`
- both SVG boards in `06_FIGMA_READY`
- `05_CLAUDE/00_EXECUTION_ORDER.md`

Do not begin with a random screen.

Build an internal model of the product first.

---

# 1. SOURCE-OF-TRUTH HIERARCHY

When sources conflict, use this order:

1. Existing Winterwork functionality/code.
2. Winterwork UX contracts in this pack.
3. Winterwork design system in this pack.
4. Existing Winterwork visual references.
5. External UI kits.
6. General design trends.

External kits are NOT the identity of Winterwork.

Use them as component and implementation references.

Recommended external references:

- Untitled UI Free Figma UI Kit: https://www.untitledui.com/free-figma-ui-kit
- Obra shadcn/ui Community: https://shadcn.obra.studio/
- Mobbin: https://mobbin.com/
- Mobbin MCP: https://mobbin.com/mcp
- UX Toolkit for Figma: https://www.antforfigma.com/ux-toolkit-for-figma

If an external kit is not attached, reconstruct the intended principles from the included Winterwork UI catalog instead of blocking or asking for it.

---

# 2. ABSOLUTE PRODUCT PRESERVATION RULE

Winterwork already contains a substantial product surface.

The current source exposes approximately 24 named screens and roughly 150 interaction handlers.

Do not delete, silently remove, or visually hide existing functionality.

Do not replace functional flows with fake presentation screens.

Do not make buttons decorative.

Do not invent unsupported backend behavior.

If an existing interaction is poor, redesign the interaction while preserving its underlying purpose.

If information is excessive, reorganize it with hierarchy, progressive disclosure, tabs, sheets, drawers or detail views.

If a feature is awkward, make it easier — do not remove it.

---

# 3. THE TARGET

The final result should feel like:

**a premium personal operating system for human performance.**

Not a fitness tracker.
Not a habit tracker.
Not a SaaS dashboard.
Not an AI dashboard.
Not a gaming app.

The emotional qualities are:

- cold
- precise
- quiet
- expensive
- intelligent
- focused
- disciplined
- cinematic
- trustworthy

The visual inspiration may borrow principles from premium automotive/spatial interfaces, high-end productivity software and modern fitness technology, but never copy their identity.

The desired reaction is:

**“This looks insanely good.”**

followed immediately by:

**“I know exactly what to do.”**

The second reaction is mandatory.

---

# 4. UX FIRST — SELF-AUDIT BEFORE DESIGN

Before visual polish, reconstruct the information architecture and critical flows.

The core product loop is:

ARC → TODAY → ACTION → COMPLETION → FEEDBACK → PROGRESS → NEXT ACTION

The major supporting systems are:

HABITS / QUIT / MOOD / FOCUS / TRAINING / NUTRITION / JOURNAL / PROFILE / SETTINGS

For every major journey, optimize:

orientation → understanding → decision → action → feedback → recovery/continuation.

Eliminate:
- unnecessary steps;
- ambiguous buttons;
- duplicate actions;
- unclear hierarchy;
- hidden critical actions;
- excessive modals;
- unnecessary confirmation dialogs;
- dead ends;
- inconsistent back behavior;
- inconsistent terminology;
- information overload;
- visual competition between multiple primary actions.

---

# 5. HIGH-FREQUENCY ACTIONS MUST BE FAST

The following actions deserve exceptional UX:

- complete habit;
- undo habit;
- add habit;
- log craving;
- log relapse;
- mood check-in;
- start focus;
- pause/resume focus;
- finish focus;
- start workout;
- log set;
- undo/edit set;
- start rest timer;
- skip exercise/set;
- finish workout;
- log nutrition;
- add water.

Do not bury these operations in multi-step navigation.

---

# 6. SCREEN-BY-SCREEN DESIGN CONTRACT

Redesign all of the following:

1. Welcome
2. Sign in
3. Create account
4. Forgot password
5. Onboarding
6. Today
7. Habits
8. Quit counter
9. Habit detail
10. Mood
11. Focus
12. Focus history
13. Progress
14. Program detail
15. Profile
16. Settings
17. Fitness setup
18. Training
19. Exercise
20. Plan detail
21. Active session
22. Session summary
23. Nutrition
24. Street

Every screen needs:
- clear purpose;
- clear primary action;
- coherent hierarchy;
- desktop layout;
- mobile layout;
- relevant empty/loading/error/offline/success states;
- accessibility;
- consistent interaction grammar.

---

# 7. TODAY — THE COMMAND CENTER

Today is the most important screen.

Within 2–3 seconds the user must understand:

- where they are in the day;
- where they are in their Arc;
- what matters most now;
- what they should do next;
- what they have already completed;
- how they are progressing.

Do not make Today a card cemetery.

Use hierarchy:

1. date / phase context;
2. next best action;
3. daily completion;
4. training/focus;
5. supporting insight.

The next action should be visually obvious without being obnoxiously large.

---

# 8. ARC — THE EMOTIONAL CORE

The 90-day Arc should feel like a journey.

Show:
- current day;
- current phase;
- completion;
- streak/continuity;
- next milestone;
- current objective;
- relationship between today's action and the larger journey.

Avoid generic progress-bar treatment.

---

# 9. HABITS

Make completion nearly instantaneous.

Habit rows should communicate:
- name;
- schedule/context;
- current state;
- streak or useful progress;
- primary completion control.

Creation/editing is secondary.

Use inline edits or sheets for small tasks.

---

# 10. QUIT

The experience must be recovery-oriented, factual and non-judgmental.

Craving and relapse actions should be easy to access.

A relapse must not feel like the product is punishing the user.

Always show a next recovery action.

---

# 11. MOOD

Basic check-in must be fast.

Advanced context can remain secondary.

Do not turn mood into a medical-looking dashboard.

---

# 12. FOCUS

Focus is immersive and low density.

During an active focus session:
- timer dominates;
- state is unmistakable;
- pause/resume is obvious;
- finish is clear;
- navigation becomes secondary.

---

# 13. TRAINING

Training is the most interaction-sensitive system.

The flow must be:

PLAN → EXERCISE → SET → REST → NEXT → SUMMARY

During an active session, the user should not need to hunt for the next action.

Current set is the visual center.

Controls must be large enough for real gym use.

Support:
- weight;
- reps;
- previous performance;
- completion;
- undo/edit;
- rest;
- skip;
- substitution;
- finish.

Do not allow decorative UI to consume the space needed for controls.

---

# 14. PROGRESS

Progress exists to answer:

**“Am I improving?”**

Every chart must have a purpose.

Prefer:
- trends;
- comparisons;
- milestones;
- useful correlations;
- concise interpretation;
- next action.

Never add a chart merely because a dashboard looks more sophisticated with one.

---

# 15. NUTRITION

Make the daily state instantly understandable:

TARGET → CONSUMED → REMAINING

Then show:
- protein;
- carbs;
- fat;
- water;
- meals.

Do not make it look like accounting software.

---

# 16. PROFILE / SETTINGS

Utility surfaces should be quiet and extremely clear.

Do not over-design settings.

Keep destructive actions isolated.

---

# 17. PAYWALL / WINTERWORK+

Premium conversion should happen in context.

When a premium feature is encountered:

1. explain the feature;
2. explain why it matters;
3. show the premium boundary;
4. offer the upgrade;
5. preserve the user's place;
6. return them to the original context after success.

Never use a generic giant paywall where a contextual upgrade can work better.

---

# 18. DESIGN SYSTEM

Build a coherent Winterwork system before styling every screen independently.

Use the component catalog in `03_UI/02_COMPONENT_CATALOG.md`.

Create reusable components for:
- shell;
- navigation;
- buttons;
- inputs;
- cards;
- metrics;
- progress;
- lists;
- habits;
- quit;
- focus;
- training;
- nutrition;
- subscription;
- feedback;
- dialogs/sheets/drawers;
- empty/loading/error states.

Every reusable component must have documented states and responsive behavior.

---

# 19. VISUAL SYSTEM

Use the design tokens in `03_UI/04_DESIGN_TOKENS.json`.

Dark-first palette:
- near-black graphite base;
- layered charcoal surfaces;
- cold neutral text hierarchy;
- icy blue/cyan accent;
- restrained semantic colors.

Do not turn the whole product blue.

Do not use generic purple AI gradients.

Do not use neon sci-fi glow everywhere.

Use spatial depth selectively:
- layered surfaces;
- subtle borders;
- controlled blur;
- soft ambient gradients;
- small amounts of translucency.

Glass is an accent, not the entire product.

---

# 20. TYPOGRAPHY

Use a modern neutral grotesk such as Inter/Geist/SF-Pro-like if available.

Hierarchy must be obvious.

Use tabular numerals for:
- timers;
- metrics;
- measurements;
- workout values.

Large numbers can be visually expressive but must remain readable.

---

# 21. RESPONSIVE DESIGN

Create intentional layouts for:

Desktop → Tablet → Mobile

Do not simply scale desktop down.

On mobile:
- prioritize action;
- reduce simultaneous information;
- use sheets/drawers where appropriate;
- preserve access to daily-critical functions;
- use thumb-friendly controls;
- maintain clear back behavior.

On desktop:
- exploit spatial breadth;
- allow secondary context without crowding the primary action;
- use persistent navigation when appropriate.

---

# 22. MOTION

Motion communicates:
- state;
- continuity;
- feedback;
- hierarchy.

Suggested:
- micro 150ms;
- standard 260ms;
- complex 420ms.

Avoid bounce-heavy UI.

Respect reduced-motion settings.

---

# 23. ACCESSIBILITY

Minimum requirements:
- readable contrast;
- visible keyboard focus;
- minimum ~44px touch targets;
- semantic labels;
- non-color-only status communication;
- logical focus order;
- readable error messages;
- reduced motion support.

---

# 24. CONTENT / VOICE

Winterwork copy is:
- direct;
- calm;
- concise;
- intelligent;
- understated;
- motivating without clichés.

Avoid:
“Great job!!! 🔥🔥🔥”

Prefer:
“Session complete.”
“Day 18 complete.”
“3 habits remaining.”

---

# 25. SELF-CRITIQUE LOOP — DO THIS YOURSELF

Before finalizing each major area, perform a ruthless internal review:

### UX
- Is the next action obvious?
- Can a first-time user understand the screen?
- Is the interaction shorter than before?
- Is any important feature hidden?
- Are states complete?

### Visual
- Is there one clear focal point?
- Is spacing consistent?
- Is typography coherent?
- Is the accent restrained?
- Is depth helping hierarchy?
- Does it feel premium rather than trendy?

### System
- Is this using an existing component?
- If a new component is necessary, can it become reusable?
- Are states consistent with the rest of Winterwork?

### Responsive
- Does the layout still work on mobile?
- Are controls thumb reachable?
- Does hierarchy survive compression?

### Regression
- Did any functionality disappear?
- Did any flow gain unnecessary steps?
- Did any action become ambiguous?

If any answer is unsatisfactory, revise before presenting the result.

---

# 26. DO NOT ASK THE USER TO DESIGN FOR YOU

Do not ask:
- which card should be bigger;
- which color to use;
- where the button should go;
- whether a sheet or modal is better;
- which layout is prettier;
- which component should be used.

You are the product designer.

Make the expert decision using the source hierarchy and UX principles.

Only ask a question if the decision would change product functionality or business logic and cannot reasonably be inferred.

---

# 27. FINAL DELIVERABLE

The canvas should contain a **complete Winterwork product redesign**, not a single hero screen.

At minimum, visually resolve:

- authentication;
- onboarding;
- Today;
- Arc;
- Habits;
- Quit;
- Mood;
- Focus + history;
- Progress;
- Training;
- Program detail;
- Exercise detail;
- Active workout;
- Session summary;
- Nutrition;
- Profile;
- Settings;
- subscription/paywall;
- Street/search/library;
- all important empty/loading/error/offline/success states;
- mobile and desktop shells.

The output must be coherent as one product.

---

# 28. FINAL QUALITY BAR

Do not stop at “looks good”.

The product must simultaneously satisfy:

**WOW visual quality**
+
**excellent UX**
+
**functional clarity**
+
**component consistency**
+
**responsive quality**
+
**accessibility**
+
**state completeness**
+
**Winterwork identity**

The final product should look like a serious premium product that could be launched, not an AI-generated design exercise.

When you encounter a weak existing design, do not preserve the weakness merely for fidelity.

Preserve the feature.
Improve the experience.

When you encounter an attractive reference, do not copy it.

Extract the principle.
Adapt it.
Make it Winterwork.

**Do the work. Self-review. Fix your own mistakes. Then present the finished design.**
