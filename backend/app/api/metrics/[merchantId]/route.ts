import { supabase } from '@/lib/supabase';
import {
  getHealthStatus,
  calculateTrend,
  calculateProjections,
} from '@/lib/calculations';
import { getBenchmarkComparison } from '@/lib/benchmarks';
import { getWeeklyComparison } from '@/lib/weekly-comparison';
import { generateRemediationPlan } from '@/lib/remediation';
import { verifyRequest, unauthorizedResponse } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { getCorsHeaders, handlePreflight } from '@/lib/cors';
import { normalizePlan, meetsMinimumPlan } from '@/lib/plan-gates';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCT_RE = /^acct_[a-zA-Z0-9]{8,}$/;
function isValidMerchantId(id: string): boolean {
  return UUID_RE.test(id) || ACCT_RE.test(id);
}

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}

/**
 * GET /api/metrics/[merchantId]
 *
 * Returns the latest health metrics for a merchant.
 * Accepts both Supabase UUID and Stripe account ID (acct_xxx).
 * Includes 7-day sparkline data for trend visualization.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  // Auth check
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, getCorsHeaders(request));
  }

  // Rate limit
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/metrics', RATE_LIMITS.metrics);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt, getCorsHeaders(request));
  }

  const { merchantId } = await params;

  if (!isValidMerchantId(merchantId)) {
    return Response.json(
      { error: 'Invalid merchantId format' },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  try {
    const url = new URL(request.url);
    const historyDaysParam = url.searchParams.get('historyDays');
    const historyDays = Math.min(Math.max(parseInt(historyDaysParam ?? '30', 10) || 30, 1), 90);

    const isStripeAccountId = merchantId.startsWith('acct_');
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, stripe_account_id, plan, mcc_code')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    const internalId = merchant.id as string;
    const plan = normalizePlan(merchant.plan as string);
    const isPro = meetsMinimumPlan(plan, 'pro');
    const isDefend = meetsMinimumPlan(plan, 'defend');

    // Get latest daily metrics
    const { data: latestMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('merchant_id', internalId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get active restriction count
    const { count: activeRestrictions } = await supabase
      .from('restrictions')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', internalId)
      .eq('resolved', false);

    // Recalculate health score factoring in active restrictions
    let healthScore = latestMetrics?.health_score ?? 100;
    if ((activeRestrictions ?? 0) > 0) {
      const { calculateHealthScore } = await import('@/lib/calculations');
      healthScore = calculateHealthScore(
        Number(latestMetrics?.fraud_ratio ?? 0) + Number(latestMetrics?.dispute_ratio ?? 0),
        Number(latestMetrics?.dispute_ratio ?? 0),
        Number(latestMetrics?.decline_rate ?? 0),
        true
      );
    }

    const currentDisputeRatio = Number(latestMetrics?.dispute_ratio ?? 0);
    const currentFraudRatio = Number(latestMetrics?.fraud_ratio ?? 0);
    const currentDeclineRate = Number(latestMetrics?.decline_rate ?? 0);

    // Base response: available to all plans (free, pro, defend)
    const response: Record<string, unknown> = {
      plan,
      healthScore,
      healthStatus: getHealthStatus(healthScore),
      disputeRatio: { current: currentDisputeRatio },
      fraudRatio: { current: currentFraudRatio },
      declineRate: { current: currentDeclineRate },
      totalCharges: latestMetrics?.total_charges ?? 0,
      totalDisputes: latestMetrics?.total_disputes ?? 0,
      totalFraudWarnings: latestMetrics?.total_fraud_warnings ?? 0,
      activeRestrictions: activeRestrictions ?? 0,
      lastUpdated: latestMetrics?.created_at ?? new Date().toISOString(),
    };

    // Pro+ features: trends, projections, sparkline, history, benchmarks, countdown
    if (isPro) {
      const [disputeTrend, fraudTrend, declineTrend] = await Promise.all([
        calculateTrend(internalId, 'dispute_ratio'),
        calculateTrend(internalId, 'fraud_ratio'),
        calculateTrend(internalId, 'decline_rate'),
      ]);

      // Add trend data to ratio objects
      response.disputeRatio = { current: currentDisputeRatio, trend: disputeTrend };
      response.fraudRatio = { current: currentFraudRatio, trend: fraudTrend };
      response.declineRate = { current: currentDeclineRate, trend: declineTrend };

      const projections = calculateProjections(
        currentDisputeRatio,
        disputeTrend,
        currentDeclineRate,
        declineTrend
      );
      response.projections = projections;

      const mccCode: string = (merchant.mcc_code as string) ?? '5999';
      response.benchmark = getBenchmarkComparison(mccCode, currentDisputeRatio);

      // 7-day sparkline for trend tracking
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: recentMetrics } = await supabase
        .from('daily_metrics')
        .select('date, dispute_ratio, fraud_ratio, decline_rate, health_score')
        .eq('merchant_id', internalId)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true });

      response.sparkline = (recentMetrics ?? []).map((row) => ({
        date: String(row.date),
        disputeRatio: Number(row.dispute_ratio),
        fraudRatio: Number(row.fraud_ratio),
        declineRate: Number(row.decline_rate),
        healthScore: Number(row.health_score),
      }));

      // Pro gets up to 30 days of history. Defend gets up to 90.
      const maxHistoryDays = isDefend ? 90 : 30;
      const clampedDays = Math.min(historyDays, maxHistoryDays);
      const historyStart = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: historyMetrics } = await supabase
        .from('daily_metrics')
        .select('date, dispute_ratio, fraud_ratio, decline_rate, health_score')
        .eq('merchant_id', internalId)
        .gte('date', historyStart)
        .order('date', { ascending: true });

      const historyRows = historyMetrics ?? [];
      response.history = {
        dates: historyRows.map((r) => String(r.date)),
        disputeRatios: historyRows.map((r) => Number(r.dispute_ratio)),
        fraudRatios: historyRows.map((r) => Number(r.fraud_ratio)),
        declineRates: historyRows.map((r) => Number(r.decline_rate)),
        healthScores: historyRows.map((r) => Number(r.health_score)),
      };
    }

    // Defend-only features: weekly comparison, remediation, velocity
    if (isDefend) {
      response.weeklyComparison = await getWeeklyComparison(internalId);

      const fullPlan = generateRemediationPlan({
        disputeRatio: currentDisputeRatio,
        fraudRatio: currentFraudRatio,
        declineRate: currentDeclineRate,
        healthScore,
        totalDisputes: Number(latestMetrics?.total_disputes ?? 0),
        totalCharges: Number(latestMetrics?.total_charges ?? 0),
        hasRestrictions: (activeRestrictions ?? 0) > 0,
      });

      response.remediation = {
        severity: fullPlan.severity,
        actionCount: fullPlan.actions.length,
        topAction: fullPlan.actions.length > 0 ? fullPlan.actions[0].title : null,
      };
    }

    return Response.json(response, { headers: getCorsHeaders(request) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[metrics] Error for merchant ${merchantId}:`, message);
    const status = isSupabaseError(err) ? 503 : 500;
    return Response.json(
      { error: 'Failed to load metrics' },
      { status, headers: getCorsHeaders(request) }
    );
  }
}

function isSupabaseError(err: unknown): boolean {
  return err instanceof Error && (
    err.message.includes('fetch failed') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('supabase')
  );
}
