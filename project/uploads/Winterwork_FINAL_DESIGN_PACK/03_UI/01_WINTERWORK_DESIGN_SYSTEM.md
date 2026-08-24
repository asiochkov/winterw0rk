# WINTERWORK — DESIGN SYSTEM V1.0

## Design intent

Winterwork should feel like a **premium personal operating system**: cold, quiet, precise, cinematic, focused, intelligent.

It combines:
- disciplined productivity software;
- premium fitness technology;
- spatial/cockpit information layering;
- restrained winter atmosphere.

It must NOT look like:
- generic SaaS;
- generic AI dashboard;
- Apple Fitness clone;
- Linear clone;
- Strava clone;
- sci-fi HUD;
- glassmorphism showcase.

## Visual principles

1. Hierarchy before decoration.
2. Surfaces create depth; glow creates emphasis.
3. One dominant focal point per screen.
4. Dark does not mean low contrast.
5. Accent is sparse and meaningful.
6. Data is editorially presented, not dumped.
7. Motion communicates state.
8. Components are calm and consistent.
9. Mobile prioritizes action.
10. Every visual effect must earn its existence.

## Color architecture

### Base
- `canvas-0`: #080B0F — global background
- `canvas-1`: #0D1117 — primary surface
- `canvas-2`: #121820 — elevated surface
- `canvas-3`: #17202A — floating surface
- `canvas-4`: #1C2631 — high-elevation surface

### Text
- `text-1`: #F3F7FA
- `text-2`: #B7C0C8
- `text-3`: #7C8791
- `text-disabled`: #56616B

### Accent
- `ice-500`: #8FD8FF
- `ice-400`: #B9E9FF
- `ice-600`: #5FBDEB
- `ice-700`: #348FBE

Accent is used for active/focused/progress/primary action states. Never fill every card with accent.

### Semantic
- success: #6FCB9A
- warning: #E4B96A
- danger: #E77A7A
- info: #8FC9FF

### Borders
- subtle: rgba(255,255,255,.07)
- standard: rgba(255,255,255,.11)
- strong: rgba(255,255,255,.17)

## Surface recipe

Most surfaces use:
- background fill;
- 1px subtle border;
- minimal shadow;
- optional 8–18px backdrop blur only where depth requires it.

Avoid full-screen blur.

## Typography

Recommended family: Inter / Geist / SF Pro-like neutral sans if available.

Use a high-quality neutral grotesk. Do not use a futuristic display font for body UI.

Suggested hierarchy:
- Display: 48–64px / 0.95–1.0
- H1: 32–40px / 1.05
- H2: 24–28px / 1.1
- H3: 18–20px / 1.2
- Body: 15–17px / 1.45
- Small: 12–14px / 1.35
- Numeric: tabular figures where measurement/time is shown

## Spacing

Base 4px. Primary rhythm: 8 / 12 / 16 / 24 / 32 / 48 / 64.

Avoid arbitrary spacing values.

## Radii

- xs: 8
- sm: 10
- md: 12
- lg: 16
- xl: 20
- hero: 24
- pill: 999

Use larger radius for large surfaces and smaller radius for controls.

## Buttons

### Primary
High contrast, compact, strong focus state.

### Secondary
Low-contrast elevated surface.

### Ghost
Transparent, only for tertiary actions.

### Destructive
Semantic danger with clear consequence.

Rules:
- minimum touch target 44px on mobile;
- icon + label when meaning is not obvious;
- loading state preserves button width;
- disabled state remains readable;
- never use five equal-priority buttons in one cluster.

## Cards

Cards are containers, not decoration.

Every card must answer:
- what is this;
- why is it here;
- what can I do;
- what is the important value.

Use:
- stat card;
- task card;
- progress card;
- timeline card;
- insight card;
- media/card;
- interactive list row.

## Progress

Use progress only when there is a meaningful target.

Variants:
- linear;
- circular/ring;
- segmented;
- milestone;
- streak.

Do not combine three different progress metaphors on one screen unless they answer different questions.

## Navigation

Active destination:
- icon;
- label;
- subtle accent/background;
- clear focus.

Do not rely on bright glow alone.

## Inputs

States:
- idle;
- focus;
- filled;
- error;
- disabled;
- success;
- loading.

Validation should be close to the field and written in human language.

## Charts

Charts require:
- title;
- time range;
- unit;
- readable axis/labels where needed;
- takeaway/insight when meaningful.

Never create a chart just to fill empty space.

## Iconography

Use one coherent outline icon family with consistent optical weight. Prefer simple, geometric icons.

## Motion

- micro: 120–160ms
- standard: 220–280ms
- complex: 380–450ms

Use ease-out for entrances, ease-in-out for state transitions.
Respect `prefers-reduced-motion`.

## Spatial treatment

Use depth through:
- layered surfaces;
- restrained radial gradients;
- subtle noise if technically safe;
- soft ambient light behind hero elements;
- controlled translucency.

Never make the UI look like a game HUD.
