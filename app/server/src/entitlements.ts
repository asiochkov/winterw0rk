/**
 * Feature gating for future paid plans.
 *
 * Every feature is currently granted to every plan — the product brief is
 * explicit that the app ships free. This module exists so that turning a
 * feature into a paid one later is a one-line change here plus a client
 * prompt, instead of scattering plan checks through the route handlers.
 */
export type Plan = 'free' | 'plus';

export type Feature =
  | 'unlimited_habits'
  | 'full_history'
  | 'advanced_analytics'
  | 'all_programs'
  | 'gps_routes'
  | 'data_export'
  | 'nutrition_macros';

const ALL_FEATURES: Feature[] = [
  'unlimited_habits',
  'full_history',
  'advanced_analytics',
  'all_programs',
  'gps_routes',
  'data_export',
  'nutrition_macros',
];

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  // Intentionally identical today. When paid plans launch, remove entries from
  // `free` rather than adding gates to individual routes.
  free: ALL_FEATURES,
  plus: ALL_FEATURES,
};

/**
 * A subscription's lifecycle. `cancelled` still grants access until the paid
 * period ends; `expired` and `past_due` do not.
 */
export type PlanStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface BillingRow {
  plan?: string | null;
  plan_status?: string | null;
  plan_period_end?: string | null;
  plan_cancel_at_period_end?: number | null;
}

/**
 * The effective plan right now. Entitlement is always derived here from stored
 * state rather than read from a flag the client can influence, and expiry is
 * evaluated on read so a lapsed subscription downgrades itself even if no
 * webhook ever arrives.
 */
export function planOf(userRow: BillingRow): Plan {
  if (userRow.plan !== 'plus') return 'free';

  const status = (userRow.plan_status ?? 'active') as PlanStatus;
  if (status === 'expired' || status === 'past_due') return 'free';

  // Active or cancelled-but-not-yet-ended: honour the paid period.
  if (userRow.plan_period_end) {
    const endsAt = new Date(userRow.plan_period_end).getTime();
    if (Number.isFinite(endsAt) && endsAt < Date.now()) return 'free';
  } else if (status === 'cancelled') {
    // Cancelled with no known end date: nothing left to honour.
    return 'free';
  }

  return 'plus';
}

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export function featuresFor(plan: Plan): Feature[] {
  return [...PLAN_FEATURES[plan]];
}
