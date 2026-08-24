# CLAUDE DESIGN MASTER PROMPT — WINTERWORK MOTION OVERHAUL

You are implementing the motion system for the existing Winterwork product.

This is NOT a motion-demo project.

Your job is to make Winterwork feel exceptionally polished through motion while preserving every existing feature, interaction, route, state and UX improvement already present in the project.

The target feeling:
**"This product feels alive, expensive and incredibly well made — but I barely notice the animation because it is helping me use the product."**

## SOURCE OF TRUTH

Priority order:
1. Existing Winterwork project/code.
2. Existing Winterwork UX architecture and product behavior.
3. Files in this Motion Master Pack.
4. Existing Winterwork visual references.
5. Motion references: Linear, Arc/Arc Search, Apple Fitness, Strava, Headspace.

Do not copy any reference's brand, assets or exact UI.

## STEP 1 — AUDIT

Before changing code:
- inspect all routes;
- inspect all components;
- inspect state transitions;
- inspect current animations;
- inspect desktop/mobile behavior;
- inspect timers, charts and data updates;
- identify the existing design token system;
- identify the current technical stack.

Create a motion implementation map before coding.

## STEP 2 — INSTALL ONE MOTION LANGUAGE

Use the tokens and contracts in this pack.

Do not invent random durations/easings.

Default motion should be:
- fast;
- subtle;
- spatially coherent;
- responsive.

Reserve cinematic motion for:
- onboarding finale;
- Arc milestones;
- personal reports;
- workout completion;
- major progress milestones.

## STEP 3 — COMPONENTS FIRST

Implement reusable motion primitives and component contracts before screen-specific animation.

At minimum:
- button press;
- checkbox/habit completion;
- toggle;
- tabs;
- cards;
- modal;
- sheet;
- toast;
- tooltip;
- progress bar/ring;
- number interpolation;
- chart reveal;
- page/context transition;
- focus timer;
- workout state feedback.

## STEP 4 — SCREEN MOTION

Apply the screen-specific map from:
03_SCREEN_SPECS/WINTERWORK_SCREEN_MOTION_MAP.md

Do not animate everything.

Each screen gets a deliberate motion hierarchy.

## STEP 5 — MOTION AS UX

For every animation ask:
- What state changed?
- What is the user's next focus?
- Does this preserve spatial orientation?
- Does it make the interaction feel faster?
- Does it reduce ambiguity?
- Is it necessary?

If the answer is no, remove the animation.

## STEP 6 — WOW MOMENTS

Create a small number of memorable moments.

### Arc
Use path/progress motion and milestone reveal.

### Personal Report
Use cinematic data storytelling.

### Workout completion
Use physical completion feedback and concise result reveal.

### Focus
Use calm breathing rhythm and stable progress.

### Onboarding
Use spatial transitions and a strong final reveal.

The rest of the app should remain restrained.

## STEP 7 — RESPONSIVE MOTION

Desktop and mobile should share the same motion language.

But adapt:
- distance;
- duration;
- gesture;
- sheet behavior;
- hover behavior.

Never use hover-dependent feedback on touch devices.

## STEP 8 — ACCESSIBILITY

Implement prefers-reduced-motion.

Reduced motion must:
- remove decorative loops;
- remove large movement;
- remove parallax;
- remove long stagger;
- preserve state feedback.

## STEP 9 — PERFORMANCE

Do not introduce heavy dependencies unless necessary.

Prefer transform/opacity.

Avoid layout thrashing.

Clean up all timers, animation frames and observers.

## STEP 10 — QA

Run every flow in the QA checklist.

Test:
- normal motion;
- reduced motion;
- desktop;
- mobile;
- rapid repeated actions;
- slow loading;
- offline/reconnect;
- long sessions.

## FINAL SELF-CRITIQUE

Before declaring completion, inspect the whole product and ask:

1. Does every screen feel like the same product?
2. Are motion durations consistent?
3. Are there any animations that exist only for decoration?
4. Does any animation slow down a task?
5. Is the active workout faster than before?
6. Is Focus calmer than before?
7. Is Today clearer than before?
8. Does the Arc feel special?
9. Does the Personal Report feel memorable?
10. Does motion remain premium when reduced-motion is enabled?
11. Are there any jarring route changes?
12. Are there any accidental scroll jumps?
13. Are there any layout shifts?
14. Are there any animation-induced state bugs?
15. Does the app still feel usable if every animation is disabled?

If any answer is unsatisfactory, fix it before finalizing.

## HARD CONSTRAINT

Do not rebuild Winterwork from scratch.

Do not remove functionality.

Do not replace working business logic.

Do not introduce giant 3D scenes.

Do not make every element bounce, float or glow.

Do not make the product look like a motion-design portfolio.

Do not make animation more important than usability.

Build a **quietly spectacular** motion system.

The user should feel:
**speed + precision + continuity + tactility + confidence.**

Not:
**effects + noise + waiting.**
