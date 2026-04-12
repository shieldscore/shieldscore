import { supabase } from '@/lib/supabase';
import { getHealthStatus } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/[merchantId]
 *
 * Returns the latest health metrics for a merchant, including:
 * - Current ratios (VAMP, MC dispute, decline rate)
 * - Health score with color status
 * - Active restriction count
 * - Last 7 days of daily metrics for mini sparkline
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;

  // Validate merchantId exists
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id, plan')
    .eq('id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return Response.json({ error: 'Merchant not found' }, { status: 404 });
  }

  // Get latest daily metrics
  const { data: latestMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  // Get last 7 days for sparkline data
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: recentMetrics } = await supabase
    .from('daily_metrics')
    .select('date, dispute_ratio, fraud_ratio, decline_rate, health_score')
    .eq('merchant_id', merchantId)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: true });

  // Get active restriction count
  const { count: activeRestrictions } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('resolved', false);

  const healthScore = latestMetrics?.health_score ?? 100;

  return Response.json({
    merchantId,
    plan: merchant.plan,
    current: {
      date: latestMetrics?.date ?? null,
      vampRatio: latestMetrics?.fraud_ratio ?? 0,
      mcDisputeRatio: latestMetrics?.dispute_ratio ?? 0,
      declineRate: latestMetrics?.decline_rate ?? 0,
      healthScore,
      healthStatus: getHealthStatus(healthScore),
      totalCharges: latestMetrics?.total_charges ?? 0,
      totalDisputes: latestMetrics?.total_disputes ?? 0,
      totalFraudWarnings: latestMetrics?.total_fraud_warnings ?? 0,
      totalDeclines: latestMetrics?.total_declines ?? 0,
    },
    activeRestrictions: activeRestrictions ?? 0,
    trend: recentMetrics ?? [],
  });
}
