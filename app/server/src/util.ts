export function todayStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(dateStr: string): number {
  // 0 = Monday ... 6 = Sunday, matching the prototype's schedule arrays
  const jsDay = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db_ = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db_ - da) / 86400000);
}

/**
 * The Monday of the week a date falls in, used as a week's identity. Weeks
 * start Monday here because the schedule arrays do (0 = Monday).
 */
export function weekStartOf(dateStr: string): string {
  return addDays(dateStr, -weekdayOf(dateStr));
}

export function scheduledOn(schedule: number[], dateStr: string): boolean {
  return schedule.includes(weekdayOf(dateStr));
}

/**
 * True when the runtime's ICU data recognises this IANA zone. Guards anything
 * user-supplied before it reaches Intl, which throws on an unknown zone.
 */
export function isKnownTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
