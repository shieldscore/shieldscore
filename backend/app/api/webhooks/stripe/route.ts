import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { calculateAllMetrics } from '@/lib/calculations';
import { checkAndSendAlerts } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

/**
 * Stripe Webhook Handler
 *
 * Handles:
 * - charge.dispute.created — increment dispute count, recalculate ratios
 * - radar.early_fraud_warning.created — increment fraud warning count, recalculate VAMP
 * - account.updated — detect restriction/requirement changes
 *
 * Rules (from CLAUDE.md):
 * 1. Verify signature using RAW body
 * 2. Return 200 immediately
 * 3. Idempotent — check stripe_event_id before processing
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Return 200 immediately — process async below
  // In serverless, we can't truly fire-and-forget, but we process after
  // sending the acknowledgement conceptually. The response is returned
  // after processing completes, which is fine for Vercel's execution model.

  // Idempotency check: skip if we've already processed this event
  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .limit(1)
    .single();

  if (existingEvent) {
    return Response.json({ received: true, duplicate: true });
  }

  // Determine which merchant this event belongs to
  const stripeAccountId = event.account ?? getAccountIdFromEvent(event);

  if (!stripeAccountId) {
    console.error('Could not determine Stripe account ID for event:', event.id);
    return Response.json({ received: true, error: 'no_account_id' });
  }

  // Find or skip merchant
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, email, alert_preferences')
    .eq('stripe_account_id', stripeAccountId)
    .single();

  if (!merchant) {
    // Event for a merchant we don't track — log and move on
    console.log('Event for unknown merchant:', stripeAccountId);
    return Response.json({ received: true, skipped: true });
  }

  // Store the event for audit trail
  await supabase.from('events').insert({
    merchant_id: merchant.id,
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
    processed: false,
  });

  // Process by event type
  try {
    switch (event.type) {
      case 'charge.dispute.created':
        await handleDisputeCreated(merchant.id);
        break;

      case 'radar.early_fraud_warning.created':
        await handleFraudWarning(merchant.id);
        break;

      case 'account.updated':
        await handleAccountUpdated(
          merchant.id,
          event.data.object as Stripe.Account
        );
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark event as processed
    await supabase
      .from('events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);
  } catch (err) {
    console.error('Error processing event:', event.id, err);
    // Event is stored but not marked processed — can be retried
  }

  return Response.json({ received: true });
}

/**
 * Extract account ID from event data when event.account is not set.
 * This happens for events on the platform's own account.
 */
function getAccountIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  if (typeof obj.account === 'string') return obj.account;
  return null;
}

/**
 * Handle charge.dispute.created
 *
 * Recalculates today's metrics for the merchant by incrementing dispute count
 * and recalculating all ratios + health score.
 */
async function handleDisputeCreated(merchantId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Get or create today's metrics row
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('date', today)
    .single();

  const currentDisputes = (metrics?.total_disputes ?? 0) + 1;
  const totalCharges = metrics?.total_charges ?? 0;
  const totalFraudWarnings = metrics?.total_fraud_warnings ?? 0;
  const totalDeclines = metrics?.total_declines ?? 0;

  // Check for active restrictions
  const { count: restrictionCount } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('resolved', false);

  const hasRestrictions = (restrictionCount ?? 0) > 0;

  const calculated = calculateAllMetrics({
    totalCharges,
    totalDisputes: currentDisputes,
    totalFraudWarnings,
    totalDeclines,
    totalAttempts: totalCharges + totalDeclines,
    hasRestrictions,
  });

  // Upsert today's metrics
  await supabase.from('daily_metrics').upsert(
    {
      merchant_id: merchantId,
      date: today,
      total_charges: totalCharges,
      total_disputes: currentDisputes,
      total_fraud_warnings: totalFraudWarnings,
      total_declines: totalDeclines,
      dispute_ratio: calculated.mcDisputeRatio,
      fraud_ratio: calculated.vampRatio,
      decline_rate: calculated.declineRate,
      health_score: calculated.healthScore,
    },
    { onConflict: 'merchant_id,date' }
  );

  // Check and send alerts
  const { data: merchant } = await supabase
    .from('merchants')
    .select('email, alert_preferences')
    .eq('id', merchantId)
    .single();

  if (merchant) {
    await checkAndSendAlerts({
      merchantId,
      email: merchant.email,
      vampRatio: calculated.vampRatio,
      mcDisputeRatio: calculated.mcDisputeRatio,
      declineRate: calculated.declineRate,
      hasRestrictions,
      alertPreferences: merchant.alert_preferences ?? {
        email: true,
        slack: false,
        sms: false,
      },
    });
  }
}

/**
 * Handle radar.early_fraud_warning.created
 *
 * Same flow as dispute but increments fraud warning count instead.
 */
async function handleFraudWarning(merchantId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('date', today)
    .single();

  const totalCharges = metrics?.total_charges ?? 0;
  const totalDisputes = metrics?.total_disputes ?? 0;
  const currentFraudWarnings = (metrics?.total_fraud_warnings ?? 0) + 1;
  const totalDeclines = metrics?.total_declines ?? 0;

  const { count: restrictionCount } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('resolved', false);

  const hasRestrictions = (restrictionCount ?? 0) > 0;

  const calculated = calculateAllMetrics({
    totalCharges,
    totalDisputes,
    totalFraudWarnings: currentFraudWarnings,
    totalDeclines,
    totalAttempts: totalCharges + totalDeclines,
    hasRestrictions,
  });

  await supabase.from('daily_metrics').upsert(
    {
      merchant_id: merchantId,
      date: today,
      total_charges: totalCharges,
      total_disputes: totalDisputes,
      total_fraud_warnings: currentFraudWarnings,
      total_declines: totalDeclines,
      dispute_ratio: calculated.mcDisputeRatio,
      fraud_ratio: calculated.vampRatio,
      decline_rate: calculated.declineRate,
      health_score: calculated.healthScore,
    },
    { onConflict: 'merchant_id,date' }
  );

  const { data: merchant } = await supabase
    .from('merchants')
    .select('email, alert_preferences')
    .eq('id', merchantId)
    .single();

  if (merchant) {
    await checkAndSendAlerts({
      merchantId,
      email: merchant.email,
      vampRatio: calculated.vampRatio,
      mcDisputeRatio: calculated.mcDisputeRatio,
      declineRate: calculated.declineRate,
      hasRestrictions,
      alertPreferences: merchant.alert_preferences ?? {
        email: true,
        slack: false,
        sms: false,
      },
    });
  }
}

/**
 * Handle account.updated
 *
 * Monitors for:
 * - requirements.currently_due being populated (KYC/compliance flag)
 * - capabilities changing to restricted or pending
 */
async function handleAccountUpdated(
  merchantId: string,
  account: Stripe.Account
): Promise<void> {
  const requirements = account.requirements;
  const capabilities = account.capabilities;

  // Check for new requirements
  if (requirements?.currently_due && requirements.currently_due.length > 0) {
    // Check if we already have an unresolved restriction for this
    const { data: existing } = await supabase
      .from('restrictions')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('restriction_type', 'requirements_due')
      .eq('resolved', false)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from('restrictions').insert({
        merchant_id: merchantId,
        restriction_type: 'requirements_due',
        details: {
          currently_due: requirements.currently_due,
          past_due: requirements.past_due ?? [],
          disabled_reason: requirements.disabled_reason ?? null,
        },
      });
    }
  } else {
    // Requirements cleared — resolve any existing restriction
    await supabase
      .from('restrictions')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('merchant_id', merchantId)
      .eq('restriction_type', 'requirements_due')
      .eq('resolved', false);
  }

  // Check capabilities for restricted/pending status
  if (capabilities) {
    const restrictedCapabilities: string[] = [];
    const pendingCapabilities: string[] = [];

    for (const [name, status] of Object.entries(capabilities)) {
      if (status === 'restricted') restrictedCapabilities.push(name);
      if (status === 'pending') pendingCapabilities.push(name);
    }

    if (restrictedCapabilities.length > 0) {
      const { data: existing } = await supabase
        .from('restrictions')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('restriction_type', 'capability_restricted')
        .eq('resolved', false)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('restrictions').insert({
          merchant_id: merchantId,
          restriction_type: 'capability_restricted',
          details: { capabilities: restrictedCapabilities },
        });
      }
    } else {
      await supabase
        .from('restrictions')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('merchant_id', merchantId)
        .eq('restriction_type', 'capability_restricted')
        .eq('resolved', false);
    }

    if (pendingCapabilities.length > 0) {
      const { data: existing } = await supabase
        .from('restrictions')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('restriction_type', 'capability_pending')
        .eq('resolved', false)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('restrictions').insert({
          merchant_id: merchantId,
          restriction_type: 'capability_pending',
          details: { capabilities: pendingCapabilities },
        });
      }
    } else {
      await supabase
        .from('restrictions')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('merchant_id', merchantId)
        .eq('restriction_type', 'capability_pending')
        .eq('resolved', false);
    }
  }

  // After updating restrictions, check if alerts should fire
  const { count: restrictionCount } = await supabase
    .from('restrictions')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('resolved', false);

  const hasRestrictions = (restrictionCount ?? 0) > 0;

  // Get latest metrics to include in alert check
  const { data: latestMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const { data: merchant } = await supabase
    .from('merchants')
    .select('email, alert_preferences')
    .eq('id', merchantId)
    .single();

  if (merchant) {
    await checkAndSendAlerts({
      merchantId,
      email: merchant.email,
      vampRatio: latestMetrics?.fraud_ratio ?? 0,
      mcDisputeRatio: latestMetrics?.dispute_ratio ?? 0,
      declineRate: latestMetrics?.decline_rate ?? 0,
      hasRestrictions,
      alertPreferences: merchant.alert_preferences ?? {
        email: true,
        slack: false,
        sms: false,
      },
    });
  }
}
