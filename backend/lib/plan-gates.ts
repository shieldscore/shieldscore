/**
 * Plan Gating Utility
 *
 * Controls which features are available on each pricing tier.
 * Higher tiers inherit all features from lower tiers:
 *   free < pro < defend
 */

export type PlanName = 'free' | 'pro' | 'defend';

const PLAN_HIERARCHY: readonly PlanName[] = ['free', 'pro', 'defend'] as const;

/**
 * Features exclusive to each tier (not including inherited features).
 * Use getPlanFeatures() to get the full list including inherited ones.
 */
const PLAN_FEATURES: Record<PlanName, readonly string[]> = {
  free: [
    'health_score',
    'dispute_ratio',
    'fraud_ratio',
    'threshold_indicators',
    'daily_updates',
  ],
  pro: [
    'email_alerts',
    'restriction_alerts',
    'trend_tracking_7d',
    'threshold_countdown',
    'dispute_breakdown',
    'dispute_guidance',
    'industry_benchmarks',
    'trend_charts_30d',
  ],
  defend: [
    'sms_alerts',
    'velocity_detection',
    'week_over_week',
    'remediation_plans',
    'trend_history_90d',
    'csv_exports',
  ],
};

function isValidPlan(plan: string): plan is PlanName {
  return PLAN_HIERARCHY.includes(plan as PlanName);
}

/**
 * Normalize a plan string to a valid PlanName, defaulting to 'free'.
 */
export function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan && isValidPlan(plan)) return plan;
  return 'free';
}

/**
 * Returns the full list of features for a plan, including all features
 * inherited from lower tiers.
 */
export function getPlanFeatures(plan: string): string[] {
  const normalized = normalizePlan(plan);
  const tierIndex = PLAN_HIERARCHY.indexOf(normalized);
  const features: string[] = [];

  for (let i = 0; i <= tierIndex; i++) {
    features.push(...PLAN_FEATURES[PLAN_HIERARCHY[i]]);
  }

  return features;
}

/**
 * Returns true if the given plan includes the specified feature.
 * Defend includes all Pro features. Pro includes all Free features.
 */
export function hasFeature(plan: string, feature: string): boolean {
  const features = getPlanFeatures(plan);
  return features.includes(feature);
}

/**
 * Returns the tier index for comparison. Higher index = higher tier.
 */
export function planTierIndex(plan: string): number {
  const normalized = normalizePlan(plan);
  return PLAN_HIERARCHY.indexOf(normalized);
}

/**
 * Check if a plan meets or exceeds a minimum required tier.
 */
export function meetsMinimumPlan(plan: string, minimumPlan: PlanName): boolean {
  return planTierIndex(plan) >= PLAN_HIERARCHY.indexOf(minimumPlan);
}
