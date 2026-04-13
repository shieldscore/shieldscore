import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { calculateAllMetrics } from '@/lib/calculations';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://dashboard.stripe.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
};

/**
 * POST /api/onboard
 *
 * Called when a new merchant installs ShieldScore and opens it for the first time.
 * Creates the merchant record and triggers an initial 30-day data sync.
 *
 * Body: { stripeAccountId: string, email?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stripeAccountId, email } = body;

    if (!stripeAccountId || typeof stripeAccountId !== 'string') {
      return NextResponse.json(
        { error: 'stripeAccountId required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate Stripe account ID format
    if (!/^acct_[a-zA-Z0-9]+$/.test(stripeAccountId)) {
      return NextResponse.json(
        { error: 'Invalid stripeAccountId format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // TODO: Verify Stripe App signature (fetchStripeSignature) on backend.
    // Stripe Apps sign requests with the app's signing secret. Once we have
    // the STRIPE_APP_SECRET configured, verify via:
    //   stripe.webhooks.constructEvent(rawBody, sig, appSecret)
    // For MVP, we validate the account ID format above as a baseline check.

    // Check if merchant already exists
    const { data: existing } = await supabase
      .from('merchants')
      .select('id')
      .eq('stripe_account_id', stripeAccountId)
      .single();

    if (existing) {
      return NextResponse.json(
        { merchantId: existing.id, status: 'existing' },
        { headers: CORS_HEADERS }
      );
    }

    // Validate email if provided
    const sanitizedEmail =
      email && typeof email === 'string' && email.includes('@')
        ? email.trim()
        : null;

    // Create new merchant
    const { data: merchant, error: insertError } = await supabase
      .from('merchants')
      .insert({
        stripe_account_id: stripeAccountId,
        email: sanitizedEmail,
        plan: 'monitor',
        alert_preferences: { email: true, slack: false, sms: false },
      })
      .select('id')
      .single();

    if (insertError) {
      // Handle race condition: another request may have inserted between our check and insert
      if (insertError.code === '23505') {
        const { data: raceWinner } = await supabase
          .from('merchants')
          .select('id')
          .eq('stripe_account_id', stripeAccountId)
          .single();

        if (raceWinner) {
          return NextResponse.json(
            { merchantId: raceWinner.id, status: 'existing' },
            { headers: CORS_HEADERS }
          );
        }
      }
      throw insertError;
    }

    // Trigger initial data pull in the background (don't block the response)
    triggerInitialSync(stripeAccountId, merchant.id).catch((err) => {
      console.error(`Initial sync failed for ${stripeAccountId}:`, err);
    });

    return NextResponse.json(
      { merchantId: merchant.id, status: 'created' },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Onboard error:', error);
    return NextResponse.json(
      { error: 'Onboarding failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Pull 30 days of historical data from Stripe and save the initial daily_metrics snapshot.
 */
async function triggerInitialSync(
  stripeAccountId: string,
  merchantId: string
): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = Math.floor(
    (now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  // Pull disputes
  let totalDisputes = 0;
  for await (const _dispute of stripe.disputes.list({
    created: { gte: thirtyDaysAgo },
    limit: 100,
  })) {
    totalDisputes++;
  }

  // Pull charges (only succeeded = settled transactions)
  let totalCharges = 0;
  for await (const charge of stripe.charges.list({
    created: { gte: thirtyDaysAgo },
    limit: 100,
  })) {
    if (charge.status === 'succeeded') totalCharges++;
  }

  // Pull early fraud warnings (TC40 reports)
  let totalFraudWarnings = 0;
  try {
    for await (const _warning of stripe.radar.earlyFraudWarnings.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    })) {
      totalFraudWarnings++;
    }
  } catch {
    // Some accounts may not have Radar access
    console.log(
      `Fraud warnings not available for account ${stripeAccountId}`
    );
  }

  // Calculate metrics
  const metrics = calculateAllMetrics({
    totalCharges,
    totalDisputes,
    totalFraudWarnings,
    totalDeclines: 0,
    totalAttempts: totalCharges,
    hasRestrictions: false,
  });

  // Save initial snapshot to daily_metrics
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
