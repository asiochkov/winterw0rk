import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, userIdOf } from '../middleware.js';
import { featuresFor, planOf, type BillingRow } from '../entitlements.js';

const router = Router();
router.use(requireAuth);

/**
 * Payment provider integration point.
 *
 * No provider is configured in this environment, so checkout is reported as
 * unavailable rather than simulated with a fake purchase. Wiring a real
 * provider means implementing these three things and nothing else in the app
 * has to change:
 *
 *   1. createCheckoutSession() -> redirect URL
 *   2. a signed webhook endpoint that updates plan / plan_status /
 *      plan_period_end / billing_subscription_id for the mapped user
 *   3. refreshFromProvider() for "restore purchases"
 *
 * Entitlement is always derived server-side from those stored columns, so the
 * client can never grant itself a plan.
 */
const PROVIDER_CONFIGURED = Boolean(process.env.BILLING_PROVIDER_SECRET_KEY);

function billingRow(userId: number): BillingRow & { id: number } {
  return db
    .prepare(
      `SELECT id, plan, plan_status, plan_period_end, plan_cancel_at_period_end
       FROM users WHERE id = ?`
    )
    .get(userId) as any;
}

router.get('/me', (req, res) => {
  const row = billingRow(userIdOf(req));
  if (!row) return res.status(404).json({ error: 'not_found' });

  const plan = planOf(row);
  res.json({
    plan,
    status: row.plan_status ?? 'active',
    periodEnd: row.plan_period_end ?? null,
    cancelAtPeriodEnd: !!row.plan_cancel_at_period_end,
    features: featuresFor(plan),
    checkoutAvailable: PROVIDER_CONFIGURED,
  });
});

router.post('/checkout', (_req, res) => {
  if (!PROVIDER_CONFIGURED) {
    // Honest 503 rather than a fake success — nothing downstream should ever
    // believe a purchase happened when no payment was taken.
    return res.status(503).json({
      error: 'Subscriptions are not available yet.',
      reason: 'billing_provider_not_configured',
    });
  }
  // Real provider call goes here once credentials exist.
  return res.status(501).json({ error: 'not_implemented' });
});

/**
 * "Restore purchases": re-reads entitlement state. With a provider configured
 * this would reconcile against the provider; without one it simply re-evaluates
 * stored state, which still correctly expires a lapsed subscription.
 */
router.post('/restore', (req, res) => {
  const row = billingRow(userIdOf(req));
  if (!row) return res.status(404).json({ error: 'not_found' });

  const plan = planOf(row);
  // Persist a downgrade discovered by the expiry check so the stored status
  // matches the effective entitlement.
  if (plan === 'free' && row.plan === 'plus' && row.plan_status !== 'expired') {
    db.prepare("UPDATE users SET plan_status = 'expired' WHERE id = ?").run(row.id);
  }

  const fresh = billingRow(userIdOf(req));
  res.json({
    plan: planOf(fresh),
    status: fresh.plan_status ?? 'active',
    periodEnd: fresh.plan_period_end ?? null,
    features: featuresFor(planOf(fresh)),
    providerConfigured: PROVIDER_CONFIGURED,
  });
});

export default router;
