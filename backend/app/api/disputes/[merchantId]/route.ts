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

  // Check for stored dispute events first (from webhooks or seeded data).
  // These are our source of truth since they match daily_metrics counts.
  const { data: disputeEvents } = await supabase
    .from('events')
    .select('stripe_event_id, payload, created_at')
    .eq('merchant_id', merchant.id)
    .eq('event_type', 'charge.dispute.created')
    .order('created_at', { ascending: false })
    .limit(20);

  let disputes: DisputeItem[] = [];

  if (disputeEvents && disputeEvents.length > 0) {
    disputes = disputeEvents.map((event) => {
      // Handle both properly stored JSONB objects and double-serialized strings
      let payload = event.payload as Record<string, unknown> | string | null;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload) as Record<string, unknown>; } catch { payload = null; }
      }
      const payloadObj = payload as Record<string, unknown> | null;
      const disputeObj = (payloadObj?.object ?? payloadObj) as Record<string, unknown> | null;
      const reason = (disputeObj?.reason as string) ?? 'general';
      const guidance = getDisputeGuidance(reason);
      const amount = (disputeObj?.amount as number) ?? 0;
      const created = Math.floor(new Date(event.created_at).getTime() / 1000);
      const evidenceDetails = disputeObj?.evidence_details as Record<string, unknown> | null;

      return {
        id: event.stripe_event_id,
        amount,
        currency: (disputeObj?.currency as string) ?? 'usd',
        status: (disputeObj?.status as string) ?? 'needs_response',
        reason,
        created,
        chargeId: (disputeObj?.charge as string) ?? null,
        respondBy: (evidenceDetails?.due_by as number) ?? null,
        ratioImpact: totalCharges > 0 ? (1 / totalCharges) * 100 : 0,
        guidance: {
          advice: guidance.advice,
          winRate: guidance.winRate,
          priority: guidance.priority,
          evidenceFields: guidance.evidenceFields,
        },
      };
    });
  } else {
    // No stored events — fetch directly from Stripe API
    try {
      const stripeDisputes: Stripe.Dispute[] = [];
      for await (const dispute of stripe.disputes.list(
        { limit: 20, expand: ['data.charge'] },
        { stripeAccount: merchant.stripe_account_id }
      )) {
        stripeDisputes.push(dispute);
        if (stripeDisputes.length >= 20) break;
      }

      disputes = stripeDisputes.map((dispute) => {
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
    } catch {
      // Stripe API may fail for demo/test accounts — return empty
    }
  }

  return Response.json({
    merchantId,
    totalCharges,
    disputes,
  });
}
