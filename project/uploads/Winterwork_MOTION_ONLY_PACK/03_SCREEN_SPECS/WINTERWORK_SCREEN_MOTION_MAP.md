# WINTERWORK SCREEN-BY-SCREEN MOTION SPEC

This is the implementation map. Claude must inspect actual routes/DOM/components and map these behaviors onto the existing implementation rather than rebuilding the application.

## 01 — APP BOOT / SPLASH

Goal:
Premium first impression without wasting time.

Sequence:
1. logo/brand mark opacity 0→1, 240ms.
2. subtle ambient glow settles, 450ms.
3. app shell appears with 120ms upward/opacity reveal.

Only on first launch/session entry where appropriate.
Do not replay a long intro on every navigation.

---

## 02 — ONBOARDING

Reference philosophy: Headspace calm + Arc spatial reveal.

Behavior:
- each step replaces the previous step with directional continuity;
- selected option gets immediate tactile feedback;
- progress indicator updates with a short 180–220ms transition;
- optional background atmosphere moves slowly;
- final completion uses one 500–700ms premium transition.

Do not create excessive confetti.

---

## 03 — APP SHELL / NAVIGATION

Desktop:
- active destination indicator slides/morphs instead of blinking;
- sidebar remains visually quiet;
- route changes use content continuity, not full-page reload animation.

Mobile:
- bottom navigation indicator moves to the new destination;
- avoid animating every icon simultaneously;
- preserve scroll position where appropriate.

---

## 04 — TODAY

This is the main command center.

On initial load:
- hero/current objective reveals first;
- secondary sections follow with very short stagger.

Completion:
- habit row transforms in place;
- check icon draws/fades in;
- progress metric interpolates;
- no modal unless necessary.

Avoid:
- every card bouncing in;
- giant dashboard entrance;
- automatic scroll jumps.

---

## 05 — ARC / 90-DAY JOURNEY

This is a high-value motion surface.

Use:
- progress path drawing;
- current day marker;
- phase transition;
- milestone reveal;
- subtle parallax/depth for the Arc surface.

When advancing:
1. current marker moves along the path;
2. progress interpolates;
3. milestone becomes active;
4. supporting copy fades in.

Do not animate the entire page.

---

## 06 — HABITS

Completion:
- press → 0.99 scale;
- check state appears;
- row background/border transitions;
- streak/progress counter updates smoothly.

Undo:
- reverse state transition rather than resetting abruptly.

Create/edit:
- sheet enters from bottom on mobile;
- dialog/panel on desktop.

---

## 07 — QUIT / RELAPSE TRACKING

Sensitive interaction.

Use restrained motion.

When logging a relapse:
- no celebratory animation;
- clear state transition;
- recovery guidance appears with a calm reveal.

When returning to recovery:
- timeline/state updates smoothly.

Motion must never feel judgmental.

---

## 08 — MOOD

Use a horizontal/arc-like selection response.

Selected mood:
- small scale + opacity;
- selected state moves focus;
- supporting label updates without page jump.

Avoid bouncing emojis excessively.

---

## 09 — FOCUS

Reference: Headspace calm rhythm.

Idle:
- subtle breathing/ambient scale loop.

Active:
- timer remains visually stable;
- progress ring/arc advances continuously;
- controls respond immediately.

Pause:
- ambient loop slows/stops;
- state becomes unmistakable.

Finish:
- timer settles;
- summary reveals in 300–500ms;
- optional milestone effect is restrained.

---

## 10 — TRAINING OVERVIEW

Cards may lift subtly on hover/press.

Starting workout:
- selected workout card becomes the source of a shared transition into the session.

Avoid flashy page wipes.

---

## 11 — ACTIVE WORKOUT

This is a high-frequency interaction surface.

Rule:
**speed > spectacle.**

Set complete:
- immediate state feedback;
- number/status transition;
- next action becomes visually primary.

Rest timer:
- continuous ring/arc;
- numeric timer updates smoothly;
- no excessive animation every second.

Next exercise:
- directional transition preserves orientation.

Workout complete:
- one premium completion sequence;
- stats count up;
- summary settles quickly.

---

## 12 — EXERCISE LIBRARY / EXERCISE DETAIL

Search/filter:
- results update without full-screen animation;
- chips animate state only.

Opening detail:
- selected card can expand/shared-transition if technically stable;
- otherwise use a quick contextual transition.

---

## 13 — PROGRESS

Charts:
- animate only on first reveal or when filters change;
- line/area draws left-to-right;
- bars interpolate height;
- numbers count up only for meaningful headline metrics.

Never animate charts on every scroll.

---

## 14 — PERSONAL REPORT

This is one of the few places where a cinematic sequence is justified.

Structure:
1. intro;
2. baseline;
3. change;
4. key achievements;
5. trends;
6. next focus.

Use:
- large numeric reveals;
- path/line drawing;
- masked transitions;
- restrained depth.

Allow user to skip/advance.

---

## 15 — NUTRITION

Logging:
- food item appears in the meal list with a short insert animation;
- calorie/macros update with interpolation;
- progress ring changes smoothly.

Do not animate the whole nutrition dashboard.

---

## 16 — PROFILE / SETTINGS

Keep motion minimal.

Use standard:
- sheet;
- accordion;
- toggle;
- segmented control;
- navigation transitions.

---

## 17 — PAYWALL / WINTERWORK+

Premium reveal:
- contextual, not intrusive;
- subtle background depth;
- feature illustration or data preview can animate once.

No aggressive looping.

---

## 18 — COMMAND PALETTE / SEARCH

Reference: Linear.

- open: scale 0.985→1 + opacity;
- search results replace smoothly;
- keyboard navigation highlights immediately;
- selected result transitions into destination.

The command palette should feel instant.

---

## 19 — EMPTY / LOADING / ERROR

Empty:
- one calm reveal.

Loading:
- skeleton shimmer only where useful;
- avoid spinner-only interfaces when progress is knowable.

Error:
- short shake only for invalid input;
- otherwise use calm state transition.

Success:
- state change + subtle confirmation.

---

## 20 — OFFLINE / SYNC

Show connectivity state through small persistent feedback.

When connection returns:
- queued state transitions to synced;
- no large modal unless data loss/conflict needs attention.
