import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getDisputeGuidance } from '@/lib/dispute-guidance';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface DisputeItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  created: number;
  chargeId: string | null;
  respondBy: number | null;
  ratioImpact: number;
  guidance: {
    advice: string;
    winRate: string;
    priority: 'high' | 'medium' | 'low';
    evidenceFields: string[];
  };
}

/**
 * GET /api/disputes/[merchantId]
 *
 * Returns the merchant's 20 most recent disputes with context,
 * ratio impact per dispute, and response guidance.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;

  // Look up merchant (accepts both Supabase UUID and Stripe account ID)
  const isStripeAccountId = merchantId.startsWith('acct_');
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id')
    .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return Response.json({ error: 'Merchant not found' }, { status: 404 });
  }

  // Get latest total_charges for ratio impact calculation
  const { data: latestMetrics } = await supabase
    .from('daily_metrics')
    .select('total_charges')
    .eq('merchant_id', merchant.id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const totalCharges = latestMetrics?.total_charges ?? 0;

  // Fetch recent disputes from Stripe
  const stripeDisputes: Stripe.Dispute[] = [];
  for await (const dispute of stripe.disputes.list(
    { limit: 20, expand: ['data.charge'] },
    { stripeAccount: merchant.stripe_account_id }
  )) {
    stripeDisputes.push(dispute);
    if (stripeDisputes.length >= 20) break;
  }

  const disputes: DisputeItem[] = stripeDisputes.map((dispute) => {
    const reason = dispute.reason ?? 'general';
    const guidance = getDisputeGuidance(reason);
    const charge = dispute.charge as Stripe.Charge | null;

    return {
      id: dispute.id,
      amount: dispute.amount,
      currency: dispute.currency,
      status: dispute.status,
      reason,
      created: dispute.created,
      chargeId: charge?.id ?? (typeof dispute.charge === 'string' ? dispute.charge : null),
      respondBy: dispute.evidence_details?.due_by ?? null,
      ratioImpact: totalCharges > 0 ? (1 / totalCharges) * 100 : 0,
      guidance: {
        advice: guidance.advice,
        winRate: guidance.winRate,
        priority: guidance.priority,
        evidenceFields: guidance.evidenceFields,
      },
    };
  });

  return Response.json({
    merchantId,
    totalCharges,
    disputes,
  });
}
