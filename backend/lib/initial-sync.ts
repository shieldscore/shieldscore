import { supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { calculateAllMetrics } from '@/lib/calculations';

/**
 * Pull 30 days of historical data from Stripe and save the initial daily_metrics snapshot.
 * Safe to call for any merchant on any Stripe account — gracefully handles accounts
 * without Radar access.
 */
export async function triggerInitialSync(
  stripeAccountId: string,
  merchantId: string
): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = Math.floor(
    (now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  let totalDisputes = 0;
  try {
    for await (const _dispute of stripe.disputes.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    })) {
      totalDisputes++;
    }
  } catch (err) {
    console.log(
      `Disputes not available for account ${stripeAccountId}:`,
      err instanceof Error ? err.message : err
    );
  }

  let totalCharges = 0;
  try {
    for await (const charge of stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    })) {
      if (charge.status === 'succeeded') totalCharges++;
    }
  } catch (err) {
    console.log(
      `Charges not available for account ${stripeAccountId}:`,
      err instanceof Error ? err.message : err
    );
  }

  let totalFraudWarnings = 0;
  try {
    for await (const _warning of stripe.radar.earlyFraudWarnings.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    })) {
      totalFraudWarnings++;
    }
  } catch {
    console.log(
      `Fraud warnings not available for account ${stripeAccountId}`
    );
  }

  const metrics = calculateAllMetrics({
    totalCharges,
    totalDisputes,
    totalFraudWarnings,
    totalDeclines: 0,
    totalAttempts: totalCharges,
    hasRestrictions: false,
  });

  const today = now.toISOString().split('T')[0];
  const { error: upsertError } = await supabase
    .from('daily_metrics')
    .upsert(
      {
        merchant_id: merchantId,
        date: today,
        total_charges: totalCharges,
        total_disputes: totalDisputes,
        total_fraud_warnings: totalFraudWarnings,
        total_refunds: 0,
        total_declines: 0,
        dispute_ratio: metrics.mcDisputeRatio,
        fraud_ratio: metrics.vampRatio,
        decline_rate: metrics.declineRate,
        health_score: metrics.healthScore,
      },
      { onConflict: 'merchant_id,date' }
    );

  if (upsertError) {
    console.error(
      `Failed to save initial metrics for ${stripeAccountId}:`,
      upsertError
    );
    throw upsertError;
  }

  console.log(
    `Initial sync complete for ${stripeAccountId}: ${totalCharges} charges, ${totalDisputes} disputes, ${totalFraudWarnings} fraud warnings, health=${metrics.healthScore}`
  );
}
