# CLAUDE DESIGN — MOTION IMPLEMENTATION CONTRACT

## 1. Inspect before editing

Before writing motion code:
- inspect the existing project structure;
- identify framework/runtime;
- identify current animation utilities;
- identify existing CSS variables/tokens;
- identify routing/state management;
- identify reusable components;
- identify current mobile/desktop breakpoints.

Do NOT replace the stack just to add motion.

## 2. Reuse existing architecture

Motion must be implemented through the project's existing component system where possible.

If a motion library already exists, use it.

If no motion library exists:
- prefer CSS transitions/keyframes for simple UI motion;
- use Web Animations API/requestAnimationFrame for controlled numeric motion;
- add a dependency only if the current environment makes it clearly safer and simpler.

Do not introduce a large animation framework merely for decorative effects.

## 3. Centralize motion tokens

Create one source of truth:
- durations;
- easing;
- distances;
- scale;
- stagger;
- reduced-motion behavior.

Do not hardcode random animation values in individual components.

## 4. Shared motion primitives

Create reusable primitives where appropriate:
- Fade;
- Slide;
- ScaleFade;
- Sheet;
- Modal;
- SharedElement;
- NumberTween;
- ProgressTween;
- StaggerGroup;
- PressFeedback;
- PageTransition.

Use names that describe behavior, not a specific screen.

## 5. Respect interaction priority

The following must NEVER be blocked by animation:
- button click;
- habit completion;
- set logging;
- timer controls;
- navigation;
- text entry;
- search;
- undo;
- back.

## 6. Avoid layout thrashing

Prefer:
transform
opacity
clip-path where safe

Avoid animating:
width
height
top
left
margin
padding

unless there is no practical alternative.

## 7. Shared-element transitions

Use only when:
- source and destination are clearly the same object;
- the implementation is stable;
- the transition improves orientation.

If shared-element animation introduces bugs, use a simpler origin-aware transition.

Correctness wins.

## 8. Touch / pointer behavior

Mobile:
- motion should track touch when a gesture is interactive;
- do not create accidental swipe navigation;
- preserve scroll.

Desktop:
- hover motion should be subtle;
- keyboard focus must receive equivalent feedback.

## 9. Accessibility

Respect:
prefers-reduced-motion: reduce

For reduced motion:
- disable decorative loops;
- remove large travel;
- remove parallax;
- remove long stagger;
- preserve state changes and focus feedback.

## 10. Performance

Test:
- low-end mobile;
- long Today page;
- workout timer;
- charts;
- modal stacks;
- rapid habit completion;
- fast route changes.

No frame-heavy global blur or giant canvas effect.

## 11. Animation lifecycle

Animations must clean up:
- timers;
- requestAnimationFrame;
- observers;
- event listeners;
- subscriptions.

Avoid memory leaks.

## 12. State correctness

Never use animation state as the source of truth.

Business state must remain authoritative.

Animation is a representation of state.

## 13. Fallback

Every animated interaction must have a correct non-animated final state.

If an animation fails:
the interface must still be usable.

## 14. No fake 3D

Use depth sparingly.
Do not rotate the entire application in 3D.
Do not create perspective gimmicks.

Spatial motion means continuity and layering, not a sci-fi demo.
