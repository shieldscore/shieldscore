import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { triggerInitialSync } from '@/lib/initial-sync';
import { verifyRequest, unauthorizedResponse } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { getCorsHeaders, handlePreflight } from '@/lib/cors';


/**
 * POST /api/onboard
 *
 * Called when a new merchant installs ShieldScore and opens it for the first time.
 * Creates the merchant record and triggers an initial 30-day data sync.
 *
 * Body: { stripeAccountId: string, email?: string }
 */
export async function POST(request: NextRequest) {
  // Auth check
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, getCorsHeaders(request));
  }

  // Rate limit — strict for onboard (5/min)
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/onboard', RATE_LIMITS.onboard);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt, getCorsHeaders(request));
  }

  try {
    const body = await request.json();
    const { stripeAccountId, email } = body;

    if (!stripeAccountId || typeof stripeAccountId !== 'string') {
      return NextResponse.json(
        { error: 'stripeAccountId required' },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    // Validate Stripe account ID format
    if (!/^acct_[a-zA-Z0-9]+$/.test(stripeAccountId)) {
      return NextResponse.json(
        { error: 'Invalid stripeAccountId format' },
        { status: 400, headers: getCorsHeaders(request) }
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
        { headers: getCorsHeaders(request) }
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
            { headers: getCorsHeaders(request) }
          );
        }
      }
      throw insertError;
    }

    // Trigger initial data pull after response is sent (survives serverless shutdown)
    after(async () => {
      try {
        await triggerInitialSync(stripeAccountId, merchant.id);
      } catch (err) {
        console.error(`Initial sync failed for ${stripeAccountId}:`, err);
      }
    });

    return NextResponse.json(
      { merchantId: merchant.id, status: 'created' },
      { status: 201, headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error('Onboard error:', error);
    return NextResponse.json(
      { error: 'Onboarding failed' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}
