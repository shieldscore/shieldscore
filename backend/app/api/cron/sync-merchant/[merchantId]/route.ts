import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { calculateAllMetrics } from '@/lib/calculations';
import { checkAndSendAlerts, sendVelocityAlert } from '@/lib/alerts';
import { detectAnomalies } from '@/lib/velocity';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/sync-merchant/[merchantId]
 *
 * Syncs metrics for a SINGLE merchant. Called by the daily-sync dispatcher.
 * Each merchant gets its own function invocation and its own timeout budget.
 *
 * Protected by CRON_SECRET — same as the dispatcher.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
): Promise<Response> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { merchantId } = await params;

  // Fetch merchant
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id, email, phone, alert_preferences')
    .eq('id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return Response.json(
      { error: 'Merchant not found', merchantId },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  try {
    const metrics = await syncMerchantMetrics(
      merchant.id,
      merchant.stripe_account_id,
      thirtyDaysAgo,
      today
    );

    // Check and send alerts
    const prefs = merchant.alert_preferences ?? {
      email: true,
      slack: false,
      sms: false,
    };

    await checkAndSendAlerts({
      merchantId: merchant.id,
      email: merchant.email,
      phone: merchant.phone ?? null,
      vampRatio: metrics.vampRatio,
      mcDisputeRatio: metrics.mcDisputeRatio,
      declineRate: metrics.declineRate,
      healthScore: metrics.healthScore,
      totalCharges: metrics.totalCharges,
      totalDisputes: metrics.totalDisputes,
      totalFraudWarnings: metrics.totalFraudWarnings,
      totalDeclines: metrics.totalDeclines,
      totalAttempts: metrics.totalAttempts,
      hasRestrictions: metrics.hasRestrictions,
      requirements: [],
      capabilities: [],
      alertPreferences: prefs,
    });

    // Velocity anomaly detection
    const anomalyReport = await detectAnomalies(merchant.id);
    if (anomalyReport.overallStatus !== 'normal') {
      await sendVelocityAlert(
        merchant.id,
        merchant.email,
        merchant.phone ?? null,
        prefs,
        anomalyReport
      );
    }

    return Response.json({
      merchantId: merchant.id,
      stripeAccountId: merchant.stripe_account_id,
      status: 'success',
      healthScore: metrics.healthScore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[sync-merchant] Failed for ${merchant.stripe_account_id}:`,
      message
    );
    return Response.json(
      {
        merchantId: merchant.id,
        stripeAccountId: merchant.stripe_account_id,
        status: 'error',
        error: message,
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Stripe API helpers with rate-limit awareness
// ---------------------------------------------------------------------------

/** Small delay between Stripe API calls to stay well under 100 req/s */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper around Stripe auto-pagination that retries once on 429.
 */
async function countWithRetry<T>(
  listFn: () => AsyncIterable<T>,
  filter?: (item: T) => boolean
): Promise<number> {
  let count = 0;
  try {
    for await (const item of listFn()) {
      if (!filter || filter(item)) count++;
    }
  } catch (err: unknown) {
    const stripeErr = err as { statusCode?: number };
    if (stripeErr.statusCode === 429) {
      // Rate limited — wait 1s and retry once
      console.warn('[sync-merchant] Stripe 429 — retrying after 1s');
      await delay(1000);
      count = 0;
      for await (const item of listFn()) {
        if (!filter || filter(item)) count++;
      }
    } else {
      throw err;
    }
  }
  return count;
}

interface SyncResult {
  vampRatio: number;
  mcDisputeRatio: number;
  declineRate: number;
  healthScore: number;
  hasRestrictions: boolean;
  totalCharges: number;
  totalDisputes: number;
  totalFraudWarnings: number;
  totalDeclines: number;
  totalAttempts: number;
}

async function syncMerchantMetrics(
  merchantId: string,
  stripeAccountId: string,
  createdAfter: number,
  today: string
): Promise<SyncResult> {
  const opts = { stripeAccount: stripeAccountId };

  // Count disputes
  const totalDisputes = await countWithRetry(
    () => stripe.disputes.list({ created: { gte: createdAfter }, limit: 100 }, opts)
  );
  await delay(100);

  // Count settled charges
  const totalCharges = await countWithRetry(
    () => stripe.charges.list({ created: { gte: createdAfter }, limit: 100 }, opts),
    (charge) => charge.status === 'succeeded'
  );
  await delay(100);

  // Count early fraud warnings
  const totalFraudWarnings = await countWithRetry(
    () => stripe.radar.earlyFraudWarnings.list({ created: { gte: createdAfter }, limit: 100 }, opts)
  );
  await delay(100);

  // Count failed charges (declines)
  const totalDeclines = await countWithRetry(
    () => stripe.charges.list({ created: { gte: createdAfter }, limit: 100 }, opts),
    (charge) => charge.status === 'failed'
  );

  // Check active restrictions
  const { count: restrictionCount } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('resolved', false);

  const hasRestrictions = (restrictionCount ?? 0) > 0;
  const totalAttempts = totalCharges + totalDeclines;

  const calculated = calculateAllMetrics({
    totalCharges,
    totalDisputes,
    totalFraudWarnings,
    totalDeclines,
    totalAttempts,
    hasRestrictions,
  });

  // Upsert today's metrics
  const { error: upsertError } = await supabase.from('daily_metrics').upsert(
    {
      merchant_id: merchantId,
      date: today,
      total_charges: totalCharges,
      total_disputes: totalDisputes,
      total_fraud_warnings: totalFraudWarnings,
      total_refunds: 0,
      total_declines: totalDeclines,
      dispute_ratio: calculated.mcDisputeRatio,
      fraud_ratio: calculated.vampRatio,
      decline_rate: calculated.declineRate,
      health_score: calculated.healthScore,
    },
    { onConflict: 'merchant_id,date' }
  );

  if (upsertError) {
    throw new Error(`Failed to upsert daily metrics: ${upsertError.message}`);
  }

  return {
    vampRatio: calculated.vampRatio,
    mcDisputeRatio: calculated.mcDisputeRatio,
    declineRate: calculated.declineRate,
    healthScore: calculated.healthScore,
    hasRestrictions,
    totalCharges,
    totalDisputes,
    totalFraudWarnings,
    totalDeclines,
    totalAttempts,
  };
}
