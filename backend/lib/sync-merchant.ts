import { getStripeClient, type StripeMode } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { calculateAllMetrics } from '@/lib/calculations';

/**
 * Full 30-day metrics re-sync for a single merchant.
 * Scopes every Stripe API call to the connected merchant account via
 * { stripeAccount }, then upserts today's snapshot in daily_metrics.
 *
 * Extracted from the cron route so it can also be invoked on demand from
 * GET /api/metrics/[merchantId]?refresh=1.
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export interface SyncResult {
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

export async function syncMerchantMetrics(
  merchantId: string,
  stripeAccountId: string,
  createdAfter: number,
  today: string,
  mode: StripeMode = 'live'
): Promise<SyncResult> {
  const client = getStripeClient(mode);
  const opts = { stripeAccount: stripeAccountId };

  const totalDisputes = await countWithRetry(
    () => client.disputes.list({ created: { gte: createdAfter }, limit: 100 }, opts)
  );
  await delay(100);

  const totalCharges = await countWithRetry(
    () => client.charges.list({ created: { gte: createdAfter }, limit: 100 }, opts),
    (charge) => charge.status === 'succeeded'
  );
  await delay(100);

  const totalFraudWarnings = await countWithRetry(
    () => client.radar.earlyFraudWarnings.list({ created: { gte: createdAfter }, limit: 100 }, opts)
  );
  await delay(100);

  const totalDeclines = await countWithRetry(
    () => client.charges.list({ created: { gte: createdAfter }, limit: 100 }, opts),
    (charge) => charge.status === 'failed'
  );

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

  const { error: upsertError } = await supabase.from('daily_metrics').upsert(
    {
      merchant_id: merchantId,
      date: today,
      mode,
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
    { onConflict: 'merchant_id,date,mode' }
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
