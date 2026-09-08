/**
 * The categories a habit may have, mirroring the client's
 * `lib/habitCategories.ts`.
 *
 * The create endpoint accepted any string at all and defaulted to GENERAL, so
 * a category the interface has no colour or icon for could be stored by any
 * caller — and the app's own onboarding stored one (SLEEP) that the row
 * component had never heard of. Validating here means the constraint holds
 * whatever calls the API, not only the form.
 */
export const HABIT_CATEGORIES = [
  'TRAINING',
  'BODY',
  'MIND',
  'FOCUS',
  'SLEEP',
  'NUTRITION',
  'GENERAL',
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];
