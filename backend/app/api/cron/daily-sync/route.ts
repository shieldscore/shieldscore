import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { calculateAllMetrics } from '@/lib/calculations';
import { checkAndSendAlerts } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * Daily Sync Cron Job
 *
 * Runs once per day (triggered by Vercel Cron or external scheduler).
 * For each merchant:
 * 1. Pulls disputes, charges, and early fraud warnings from Stripe (rolling 30-day window)
 * 2. Calculates VAMP ratio, MC dispute ratio, decline rate, and health score
 * 3. Upserts today's daily_metrics row
 * 4. Checks alert thresholds and sends notifications if needed
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: Request): Promise<Response> {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  // Fetch all merchants
  const { data: merchants, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id, email, alert_preferences');

  if (merchantError || !merchants) {
    console.error('Failed to fetch merchants:', merchantError);
    return Response.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 }
    );
  }

  const results: Array<{
    merchantId: string;
    stripeAccountId: string;
    status: 'success' | 'error';
    healthScore?: number;
    error?: string;
  }> = [];

  for (const merchant of merchants) {
    try {
      const metrics = await syncMerchantMetrics(
        merchant.id,
        merchant.stripe_account_id,
        thirtyDaysAgo,
        today
      );

      // Check and send alerts
      await checkAndSendAlerts({
        merchantId: merchant.id,
        email: merchant.email,
        vampRatio: metrics.vampRatio,
        mcDisputeRatio: metrics.mcDisputeRatio,
        declineRate: metrics.declineRate,
        hasRestrictions: metrics.hasRestrictions,
        alertPreferences: merchant.alert_preferences ?? {
          email: true,
          slack: false,
          sms: false,
        },
      });

      results.push({
        merchantId: merchant.id,
        stripeAccountId: merchant.stripe_account_id,
        status: 'success',
        healthScore: metrics.healthScore,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        `Failed to sync merchant ${merchant.stripe_account_id}:`,
        message
      );
      results.push({
        merchantId: merchant.id,
        stripeAccountId: merchant.stripe_account_id,
        status: 'error',
        error: message,
      });
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  console.log(
    `Daily sync complete: ${successCount} succeeded, ${errorCount} failed out of ${merchants.length} merchants`
  );

  return Response.json({
    date: today,
    totalMerchants: merchants.length,
    successCount,
    errorCount,
    results,
  });
}

interface SyncResult {
  vampRatio: number;
  mcDisputeRatio: number;
  declineRate: number;
  healthScore: number;
  hasRestrictions: boolean;
}

/**
 * Sync a single merchant's metrics from Stripe API.
 *
 * Uses auto-pagination to count all records in the 30-day window.
 * Stripe's list endpoints return most recent first, so we paginate
 * until we hit records older than our window.
 */
async function syncMerchantMetrics(
  merchantId: string,
  stripeAccountId: string,
  createdAfter: number,
  today: string
): Promise<SyncResult> {
  // Count disputes in the rolling 30-day window
  let totalDisputes = 0;
  for await (const _dispute of stripe.disputes.list(
    { created: { gte: createdAfter }, limit: 100 },
    { stripeAccount: stripeAccountId }
  )) {
    totalDisputes++;
  }

  // Count settled charges in the rolling 30-day window
  let totalCharges = 0;
  for await (const charge of stripe.charges.list(
    { created: { gte: createdAfter }, limit: 100 },
    { stripeAccount: stripeAccountId }
  )) {
    if (charge.status === 'succeeded') {
      totalCharges++;
    }
  }

  // Count early fraud warnings (TC40 reports) in the rolling 30-day window
  let totalFraudWarnings = 0;
  for await (const _warning of stripe.radar.earlyFraudWarnings.list(
    { created: { gte: createdAfter }, limit: 100 },
    { stripeAccount: stripeAccountId }
  )) {
    totalFraudWarnings++;
  }

  // Count failed charges (declines) for decline rate calculation
  let totalDeclines = 0;
  for await (const charge of stripe.charges.list(
    { created: { gte: createdAfter }, limit: 100 },
    { stripeAccount: stripeAccountId }
  )) {
    if (charge.status === 'failed') {
      totalDeclines++;
    }
  }

  // Check for active restrictions
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
      total_refunds: 0, // TODO: count refunds when needed
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
  };
}
