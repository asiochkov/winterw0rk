# MOTION QA — RUTHLESS CHECKLIST

## Functional
- [ ] No feature was removed.
- [ ] No route was broken.
- [ ] Navigation works with keyboard and touch.
- [ ] Back behavior remains correct.
- [ ] Form submission remains immediate.
- [ ] Workout logging remains immediate.
- [ ] Focus controls remain immediate.
- [ ] Undo/recovery remains immediate.

## Visual
- [ ] No random easing curves.
- [ ] No random durations.
- [ ] No component uses a different motion language without reason.
- [ ] No excessive stagger.
- [ ] No giant page transitions.
- [ ] No constant background animation outside designated ambient contexts.
- [ ] No motion competes with the primary task.

## UX
- [ ] Motion explains state.
- [ ] User can predict what will happen.
- [ ] User can interrupt/skip long sequences.
- [ ] No action is hidden behind animation.
- [ ] No automatic scroll surprises.
- [ ] No focus is lost during transitions.

## Accessibility
- [ ] prefers-reduced-motion is supported.
- [ ] Focus states remain visible.
- [ ] Motion is not the only way state is communicated.
- [ ] Color is not the only state signal.

## Performance
- [ ] No layout thrashing.
- [ ] No continuous expensive filters.
- [ ] No memory leaks from timers/RAF/listeners.
- [ ] No visible jank during workout timer.
- [ ] No visible jank during chart updates.
- [ ] No visible jank on mobile.

## Product-level test
Run these exact flows:
1. Open app → Today → complete habit → undo → complete again.
2. Today → Focus → start → pause → resume → finish.
3. Training → workout → set → rest → next exercise → finish.
4. Progress → filter → chart update → return.
5. Arc → milestone → detail → back.
6. Nutrition → add meal → update totals.
7. Quit → log event → recovery state → undo if supported.
8. Settings → change option → return.
9. Offline → perform supported action → reconnect → sync.
10. Enable reduced motion → repeat representative flows.

## Final question

If all animations were removed, would the product still work perfectly?

If NO:
the implementation is using motion as functionality instead of feedback.

If YES:
the motion layer is doing its job.
