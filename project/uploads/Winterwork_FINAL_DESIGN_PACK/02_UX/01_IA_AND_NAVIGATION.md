# WINTERWORK UX — INFORMATION ARCHITECTURE

## Product mental model

Winterwork is a **personal operating system for disciplined progress**. The product is not a collection of trackers. The user should perceive one loop:

**ARC → TODAY → ACTION → COMPLETION → FEEDBACK → PROGRESS → NEXT ACTION**

Secondary systems support that loop:

**HABITS / QUIT / MOOD / FOCUS / TRAINING / NUTRITION / JOURNAL / PROFILE / SETTINGS**

## Primary navigation

### Desktop
Use a persistent, compact left rail/sidebar with:
- Today
- Arc
- Habits
- Training
- Focus
- Progress
- Nutrition

Secondary:
- Journal / Mood
- Exercise library
- Profile
- Settings

The current destination must be obvious without relying on color alone.

### Mobile
Use a bottom navigation with no more than 4–5 primary destinations. Recommended:
- Today
- Arc
- Training
- Focus
- More

More contains secondary systems. Do not hide a daily-critical action inside More.

## Global rules

- One concept has one name everywhere.
- One primary action per view.
- Back always returns to the previous meaningful context.
- Opening a secondary task must not erase the user's place.
- Preserve scroll position when returning from detail where practical.
- Use sheets for short mobile tasks; full pages for deep tasks.
- Use dialogs only for destructive/high-consequence decisions.
- Use command palette/search for power users, never as the only route.

## Global shell

Every authenticated screen has:
- global identity/context;
- destination title;
- optional date/phase context;
- primary action if needed;
- content region;
- persistent navigation;
- unobtrusive status/feedback layer.

The shell must disappear or simplify during immersive states such as active workout and active focus.

## Contextual shell states

### Normal
Navigation visible.

### Focus mode
Navigation de-emphasized or hidden.

### Active workout
Navigation hidden; show session progress and an explicit exit path.

### Modal task
Background remains legible but interaction is blocked only when necessary.

### Offline
Show a compact persistent status, not a giant error page.
