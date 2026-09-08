import type { IconName } from '../components/V6Icon';

/**
 * The one list of habit categories.
 *
 * There were three lists before, and they disagreed. HabitRow and TodayHabits
 * each carried their own copy of a four-entry colour map; onboarding created a
 * SLEEP habit that appeared in neither, so the app's own first-run flow
 * produced a grey fallback row on day one; and the server accepted any string
 * at all, defaulting to GENERAL — a fifth value the maps had never heard of.
 *
 * Adding a category now means adding it here, and the form, the rows and the
 * server validation all pick it up together.
 */
export const HABIT_CATEGORIES = [
  { value: 'TRAINING', labelKey: 'catTraining', rgb: '--amr', icon: 'train' },
  { value: 'BODY', labelKey: 'catBody', rgb: '--okr', icon: 'body' },
  { value: 'MIND', labelKey: 'catMind', rgb: '--acr', icon: 'focus' },
  { value: 'FOCUS', labelKey: 'catFocus', rgb: '--deepr', icon: 'ring' },
  { value: 'SLEEP', labelKey: 'catSleep', rgb: '--acr', icon: 'time' },
  { value: 'NUTRITION', labelKey: 'catNutrition', rgb: '--okr', icon: 'food' },
  { value: 'GENERAL', labelKey: 'catGeneral', rgb: '--mutr', icon: 'dot' },
] as const satisfies readonly {
  value: string;
  labelKey: string;
  rgb: string;
  icon: IconName;
}[];

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]['value'];

/** GENERAL is the server's own default, so it is also the safe landing spot
 *  for a category stored before this list existed. */
export const DEFAULT_CATEGORY: HabitCategory = 'GENERAL';

const BY_VALUE = new Map<string, (typeof HABIT_CATEGORIES)[number]>(
  HABIT_CATEGORIES.map((c) => [c.value, c])
);

export function categoryStyle(category: string): { rgb: string; icon: IconName } {
  const found = BY_VALUE.get(category.toUpperCase());
  const fallback = BY_VALUE.get(DEFAULT_CATEGORY)!;
  return { rgb: (found ?? fallback).rgb, icon: (found ?? fallback).icon };
}

export function categoryLabel(category: string, t: (key: never) => string): string {
  const found = BY_VALUE.get(category.toUpperCase());
  // A habit created before the list was closed keeps showing whatever it says.
  return found ? t(found.labelKey as never) : category;
}
