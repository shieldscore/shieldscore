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

  // CRITICAL: every Stripe API call must target the connected merchant's
  // account, not our platform account. Without stripeAccount, .list() runs
  // against our own dashboard and every merchant sees OUR numbers.
  const opts = { stripeAccount: stripeAccountId };

  let totalDisputes = 0;
  try {
    for await (const _dispute of stripe.disputes.list(
      { created: { gte: thirtyDaysAgo }, limit: 100 },
      opts
    )) {
      totalDisputes++;
    }
  } catch (err) {
    console.log(
      `Disputes not available for account ${stripeAccountId}:`,
      err instanceof Error ? err.message : err
    );
  }

  let totalCharges = 0;
  let totalDeclines = 0;
  try {
    for await (const charge of stripe.charges.list(
      { created: { gte: thirtyDaysAgo }, limit: 100 },
      opts
    )) {
      if (charge.status === 'succeeded') totalCharges++;
      else if (charge.status === 'failed') totalDeclines++;
    }
  } catch (err) {
    console.log(
      `Charges not available for account ${stripeAccountId}:`,
      err instanceof Error ? err.message : err
    );
  }

  let totalFraudWarnings = 0;
  try {
    for await (const _warning of stripe.radar.earlyFraudWarnings.list(
      { created: { gte: thirtyDaysAgo }, limit: 100 },
      opts
    )) {
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
    totalDeclines,
    totalAttempts: totalCharges + totalDeclines,
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
        total_declines: totalDeclines,
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
    `Initial sync complete for ${stripeAccountId}: ${totalCharges} charges, ${totalDeclines} declines, ${totalDisputes} disputes, ${totalFraudWarnings} fraud warnings, health=${metrics.healthScore}`
  );
}
