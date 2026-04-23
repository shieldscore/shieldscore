import { after } from 'next/server';
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
import { triggerInitialSync } from '@/lib/initial-sync';

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
 * Build a safe empty/default metrics shape. Used when a merchant has just been
 * auto-onboarded (initializing) or has no daily_metrics yet. Shape matches what
 * the dashboard expects so it renders without crashing on any plan tier.
 */
function emptyMetricsShape(plan: string, initializing: boolean): Record<string, unknown> {
  const trend = { direction: 'flat' as const, delta: 0, periodDays: 7 };
  return {
    plan,
    initializing,
    healthScore: 100,
    healthStatus: 'green',
    disputeRatio: { current: 0, trend },
    fraudRatio: { current: 0, trend },
    declineRate: { current: 0, trend },
    totalCharges: 0,
    totalDisputes: 0,
    totalFraudWarnings: 0,
    activeRestrictions: 0,
    projections: {
      daysUntilCMM: null,
      daysUntilVAMP: null,
      daysUntilEnumeration: null,
    },
    benchmark: {
      industryName: 'General retail',
      averageDisputeRatio: 0,
      merchantRatio: 0,
      performance: 'average',
    },
    sparkline: [],
    history: {
      dates: [],
      disputeRatios: [],
      fraudRatios: [],
      declineRates: [],
      healthScores: [],
    },
    weeklyComparison: {
      thisWeek: {
        avgDisputeRatio: 0,
        avgFraudRatio: 0,
        avgDeclineRate: 0,
        avgHealthScore: 100,
        totalDisputes: 0,
        totalCharges: 0,
      },
      lastWeek: {
        avgDisputeRatio: 0,
        avgFraudRatio: 0,
        avgDeclineRate: 0,
        avgHealthScore: 100,
        totalDisputes: 0,
        totalCharges: 0,
      },
      changes: {
        disputeRatio: { delta: 0, direction: 'flat' },
        fraudRatio: { delta: 0, direction: 'flat' },
        declineRate: { delta: 0, direction: 'flat' },
        healthScore: { delta: 0, direction: 'flat' },
      },
      summary: initializing
        ? 'Loading initial data from Stripe. This takes about 30 seconds.'
        : 'Not enough data for weekly comparison',
      hasEnoughData: false,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Auto-create a merchant record for a Stripe account and kick off the initial sync.
 * Handles the race where two requests arrive simultaneously for a new account.
 * Returns { internalId, plan } on success, or null on failure.
 *
 * Does not specify `plan` in the insert — the DB column default applies, which
 * keeps us compatible across schema migrations (pre-006 default is 'monitor',
 * post-006 default is 'free').
 */
async function autoOnboardMerchant(
  stripeAccountId: string
): Promise<{ internalId: string; plan: string } | null> {
  const { data: merchant, error: insertError } = await supabase
    .from('merchants')
    .insert({
      stripe_account_id: stripeAccountId,
      email: null,
      alert_preferences: { email: true, slack: false, sms: false },
    })
    .select('id, plan')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raceWinner } = await supabase
        .from('merchants')
        .select('id, plan')
        .eq('stripe_account_id', stripeAccountId)
        .single();
      if (!raceWinner) return null;
      return {
        internalId: raceWinner.id as string,
        plan: (raceWinner.plan as string) ?? 'free',
      };
    }
    console.error(
      `[metrics] Auto-onboard insert failed for ${stripeAccountId}:`,
      insertError
    );
    return null;
  }

  after(async () => {
    try {
      await triggerInitialSync(stripeAccountId, merchant.id as string);
    } catch (err) {
      console.error(
        `[metrics] Initial sync failed for ${stripeAccountId}:`,
        err
      );
    }
  });

  return {
    internalId: merchant.id as string,
    plan: (merchant.plan as string) ?? 'free',
  };
}

/**
 * GET /api/metrics/[merchantId]
 *
 * Returns the latest health metrics for a merchant.
 * Accepts both Supabase UUID and Stripe account ID (acct_xxx).
 *
 * If the merchant does not exist yet and the ID is a valid Stripe account ID,
 * the merchant is auto-created and an initial sync is kicked off. In that case
 * the response returns 200 with default values and `initializing: true` so the
 * dashboard can render a loading state rather than an error.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, getCorsHeaders(request));
  }

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
      if (isStripeAccountId) {
        const created = await autoOnboardMerchant(merchantId);
        if (!created) {
          return Response.json(
            emptyMetricsShape('free', true),
            { headers: getCorsHeaders(request) }
          );
        }
        return Response.json(
          emptyMetricsShape(normalizePlan(created.plan), true),
          { headers: getCorsHeaders(request) }
        );
      }
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    const internalId = merchant.id as string;
    const plan = normalizePlan(merchant.plan as string);
    const isPro = meetsMinimumPlan(plan, 'pro');
    const isDefend = meetsMinimumPlan(plan, 'defend');

    const { data: latestMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('merchant_id', internalId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!latestMetrics) {
      return Response.json(
        emptyMetricsShape(plan, true),
        { headers: getCorsHeaders(request) }
      );
    }

    const { count: activeRestrictions } = await supabase
      .from('restrictions')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', internalId)
      .eq('resolved', false);

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

    const response: Record<string, unknown> = {
      ...emptyMetricsShape(plan, false),
      healthScore,
      healthStatus: getHealthStatus(healthScore),
      disputeRatio: {
        current: currentDisputeRatio,
        trend: { direction: 'flat', delta: 0, periodDays: 7 },
      },
      fraudRatio: {
        current: currentFraudRatio,
        trend: { direction: 'flat', delta: 0, periodDays: 7 },
      },
      declineRate: {
        current: currentDeclineRate,
        trend: { direction: 'flat', delta: 0, periodDays: 7 },
      },
      totalCharges: latestMetrics?.total_charges ?? 0,
      totalDisputes: latestMetrics?.total_disputes ?? 0,
      totalFraudWarnings: latestMetrics?.total_fraud_warnings ?? 0,
      activeRestrictions: activeRestrictions ?? 0,
      lastUpdated: latestMetrics?.created_at ?? new Date().toISOString(),
    };

    if (isPro) {
      const [disputeTrend, fraudTrend, declineTrend] = await Promise.all([
        calculateTrend(internalId, 'dispute_ratio'),
        calculateTrend(internalId, 'fraud_ratio'),
        calculateTrend(internalId, 'decline_rate'),
      ]);

      response.disputeRatio = { current: currentDisputeRatio, trend: disputeTrend };
      response.fraudRatio = { current: currentFraudRatio, trend: fraudTrend };
      response.declineRate = { current: currentDeclineRate, trend: declineTrend };

      response.projections = calculateProjections(
        currentDisputeRatio,
        disputeTrend,
        currentDeclineRate,
        declineTrend
      );

      const mccCode: string = (merchant.mcc_code as string) ?? '5999';
      response.benchmark = getBenchmarkComparison(mccCode, currentDisputeRatio);

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
