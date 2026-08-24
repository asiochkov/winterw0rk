# COMPONENT MOTION CONTRACTS

## Button
Hover: +1% scale or 1px elevation, 120ms.
Press: 0.99 scale, 80–120ms.
Loading: preserve button width; replace content with loader.
Success: icon state replaces label only if space permits.
Never make buttons bounce.

## Icon Button
Hover: subtle surface/opacity.
Press: 0.98–0.99 scale.
Do not rotate icons unless rotation communicates state.

## Checkbox / Habit completion
Press → check draw/fade → row state update → metric interpolation.

## Toggle
Thumb movement must be immediate and physically coherent.
Do not use long easing.

## Tabs
Active indicator moves between tabs rather than disappearing/reappearing.

## Segmented Control
Selection background morphs/slides.

## Card
Hover desktop: 1px lift + slight shadow.
Press mobile: 0.99 scale.
Expansion: preserve origin.

## Modal
Backdrop: opacity 0→target 140–180ms.
Panel: 0.985→1 + 8px upward movement, 180–240ms.
Close: shorter than open.

## Bottom Sheet
Enter from bottom 16–24px, 220–300ms.
Drag follows finger directly.
Dismiss velocity should feel physical.

## Toast
Enter from edge 180–220ms.
Exit 120–180ms.
Never stack a huge number of toasts.

## Tooltip
Delay before show; fast fade/translate 100–160ms.
Do not animate tooltips on every hover if they cause noise.

## Dropdown
Origin-aware scale/opacity.
No center-screen modal animation.

## Progress Bar
Value interpolation 220–500ms depending on magnitude.
Never reset to zero before moving to new value.

## Progress Ring
Stroke-dashoffset interpolation.
Do not spin indefinitely.

## Chart
Draw once on reveal.
Filter changes animate between states rather than clearing the chart.

## Number
Use numeric interpolation for headline metrics.
Avoid odometer-style animation for ordinary text.

## Skeleton
Low-contrast shimmer only if load is longer than a short threshold.
Respect reduced motion.

## Navigation
Active state morphs/slides.
Destination content should not wait for nav animation to finish.

## Search
Results should feel instantaneous.
Use opacity/position for replacement rather than page-level animation.

## Workout controls
Immediate response is mandatory.
No decorative delay between set completion and next action.

## Focus timer
Use stable visual rhythm.
The timer itself should not constantly jump.
