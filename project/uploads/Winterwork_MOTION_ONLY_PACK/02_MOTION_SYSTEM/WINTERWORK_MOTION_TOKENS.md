# WINTERWORK MOTION SYSTEM

## Motion philosophy

Winterwork motion should feel:
- premium;
- controlled;
- tactile;
- quiet;
- precise;
- responsive;
- cinematic only at meaningful moments.

The user should feel that the interface has physical continuity, not that an animation has been added.

## Motion hierarchy

### Tier 0 — no motion
Use for:
- static reading;
- dense data;
- destructive confirmations;
- high-frequency repeated interactions;
- performance-critical contexts.

### Tier 1 — micro feedback
100–160ms.
Examples:
- button press;
- checkbox;
- toggle;
- icon state;
- hover;
- focus ring;
- small badge.

### Tier 2 — component transition
160–240ms.
Examples:
- dropdown;
- tooltip;
- card expansion;
- inline validation;
- tab indicator;
- sheet entry.

### Tier 3 — context transition
220–360ms.
Examples:
- page/section transition;
- drawer;
- modal;
- route change;
- shared element transition;
- dashboard section reveal.

### Tier 4 — hero / milestone
450–900ms, rare.
Examples:
- Arc milestone;
- personal report reveal;
- workout completion;
- 90-day completion;
- onboarding finale.

Tier 4 must never block ordinary work.

## Easing

Preferred:
- standard ease-out for entrances;
- ease-in-out for spatial movement;
- spring-like response only for tactile interactions;
- linear only for continuous loops such as timers/progress sweeps.

Avoid robotic linear movement for UI transitions.

## Distance

Keep travel small:
- micro: 2–6px;
- component: 6–16px;
- context: 12–28px;
- hero: up to 40px if justified.

Avoid large flying elements.

## Scale

Default:
0.98 → 1 for entering surfaces.

Pressed:
0.985–0.995.

Never use dramatic 0.8 → 1 scaling for ordinary UI.

## Opacity

Default:
0 → 1 for entering overlays.

For content that should preserve continuity:
0.65 → 1 instead of disappearing completely.

## Blur

Use very small blur only for premium reveal:
- 4–10px initial blur;
- 0px final.

Never animate huge blur fields across the entire page.

## Stagger

Use only for grouped content:
- 20–40ms per item;
- maximum practical stagger ~160ms total.

Do not make every card enter one-by-one.

## Motion budget

Per ordinary screen:
- 1 primary transition;
- 2–4 micro feedback moments;
- optional ambient motion.

No continuous background animation unless it is part of Focus/hero/Arc.

## Reduced motion

When prefers-reduced-motion is enabled:
- remove large translations;
- remove parallax;
- remove decorative loops;
- remove long stagger;
- replace with opacity/color/state changes;
- preserve functional feedback.

## Performance

Prefer:
- transform;
- opacity;
- clip-path only where safe;
- CSS variables;
- requestAnimationFrame for controlled numeric animation.

Avoid animating:
- width/height where transform can work;
- top/left where transform can work;
- expensive filters across large surfaces;
- layout-heavy properties;
- giant blur layers.

## Continuity rule

When moving from one context to another, preserve:
- position;
- scale relationship;
- identity;
- semantic meaning.

A card that becomes a detail page should feel like the same object expanding, not two unrelated screens.

## Motion should never delay the user

Normal interaction must remain available immediately.

Animation is feedback, not a gate.
