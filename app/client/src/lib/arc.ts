/**
 * The arc: the fixed run of days the whole product is framed around.
 *
 * This was copied word for word into Today.tsx and Profile.tsx. Two copies of
 * a date calculation is how the two screens end up disagreeing about what day
 * it is the first time the rule changes — pausing an arc, say, or counting
 * from the user's own timezone rather than UTC.
 */
export const DEFAULT_ARC_LENGTH_DAYS = 90;

/** 1-based: the day the arc started is day 1, not day 0. */
export function dayOfArc(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate + 'T00:00:00Z').getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
  return Math.max(1, Math.round((now - start) / 86400000) + 1);
}

export function daysLeftInArc(startDate: string | null, lengthDays = DEFAULT_ARC_LENGTH_DAYS): number {
  return Math.max(0, lengthDays - dayOfArc(startDate));
}

/** True once the arc has run its full length — the point it should end with
 *  something rather than quietly keep counting. */
export function isArcComplete(startDate: string | null, lengthDays = DEFAULT_ARC_LENGTH_DAYS): boolean {
  return startDate != null && dayOfArc(startDate) > lengthDays;
}
