import { supabase } from '@/lib/supabase';
import {
  getHealthStatus,
  calculateTrend,
  calculateProjections,
} from '@/lib/calculations';
import { getBenchmarkComparison } from '@/lib/benchmarks';

export const dynamic = 'force-dynamic';

// TODO: Lock down to https://dashboard.stripe.com before production deploy
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/metrics/[merchantId]
 *
 * Returns the latest health metrics for a merchant.
 * Accepts both Supabase UUID and Stripe account ID (acct_xxx).
 * Includes 7-day sparkline data for trend visualization.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;

  const isStripeAccountId = merchantId.startsWith('acct_');
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id, plan, mcc_code')
    .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return Response.json(
      { error: 'Merchant not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const internalId = merchant.id as string;

  // Get latest daily metrics
  const { data: latestMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('merchant_id', internalId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Get 7-day history for sparkline charts
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: recentMetrics } = await supabase
    .from('daily_metrics')
    .select('date, dispute_ratio, fraud_ratio, decline_rate, health_score')
    .eq('merchant_id', internalId)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: true });

  // Get active restriction count
  const { count: activeRestrictions } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', internalId)
    .eq('resolved', false);

  // Recalculate health score factoring in active restrictions
  // The stored health_score may not reflect current restriction status
  let healthScore = latestMetrics?.health_score ?? 100;
  if ((activeRestrictions ?? 0) > 0) {
    // Apply -15 restriction penalty if not already baked in
    // Re-derive from raw ratios to ensure consistency
    const { calculateHealthScore } = await import('@/lib/calculations');
    healthScore = calculateHealthScore(
      Number(latestMetrics?.fraud_ratio ?? 0) + Number(latestMetrics?.dispute_ratio ?? 0),
      Number(latestMetrics?.dispute_ratio ?? 0),
      Number(latestMetrics?.decline_rate ?? 0),
      true
    );
  }

  const [disputeTrend, fraudTrend, declineTrend] = await Promise.all([
    calculateTrend(internalId, 'dispute_ratio'),
    calculateTrend(internalId, 'fraud_ratio'),
    calculateTrend(internalId, 'decline_rate'),
  ]);

  const currentDisputeRatio = Number(latestMetrics?.dispute_ratio ?? 0);
  const currentFraudRatio = Number(latestMetrics?.fraud_ratio ?? 0);
  const currentDeclineRate = Number(latestMetrics?.decline_rate ?? 0);

  const projections = calculateProjections(
    currentDisputeRatio,
    disputeTrend,
    currentDeclineRate,
    declineTrend
  );

  const mccCode: string = (merchant.mcc_code as string) ?? '5999';
  const benchmark = getBenchmarkComparison(mccCode, currentDisputeRatio);

  // Format sparkline data for the Stripe App charts
  const sparkline = (recentMetrics ?? []).map((row) => ({
    date: String(row.date),
    disputeRatio: Number(row.dispute_ratio),
    fraudRatio: Number(row.fraud_ratio),
    declineRate: Number(row.decline_rate),
    healthScore: Number(row.health_score),
  }));

  return Response.json(
    {
      healthScore,
      healthStatus: getHealthStatus(healthScore),
      disputeRatio: { current: currentDisputeRatio, trend: disputeTrend },
      fraudRatio: { current: currentFraudRatio, trend: fraudTrend },
      declineRate: { current: currentDeclineRate, trend: declineTrend },
      totalCharges: latestMetrics?.total_charges ?? 0,
      totalDisputes: latestMetrics?.total_disputes ?? 0,
      totalFraudWarnings: latestMetrics?.total_fraud_warnings ?? 0,
      activeRestrictions: activeRestrictions ?? 0,
      projections,
      benchmark,
      sparkline,
      lastUpdated: latestMetrics?.created_at ?? new Date().toISOString(),
    },
    { headers: CORS_HEADERS }
  );
}
