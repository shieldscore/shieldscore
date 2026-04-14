import { supabase } from '@/lib/supabase';
import { verifyRequest, unauthorizedResponse } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { getCorsHeaders, handlePreflight } from '@/lib/cors';
import { normalizePlan, getPlanFeatures } from '@/lib/plan-gates';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCT_RE = /^acct_[a-zA-Z0-9]{8,}$/;

function isValidMerchantId(id: string): boolean {
  return UUID_RE.test(id) || ACCT_RE.test(id);
}

export async function OPTIONS(request: Request) {
  return handlePreflight(request);
}

/**
 * GET /api/plan/[merchantId]
 *
 * Returns the merchant's current plan, feature list, and plan_updated_at.
 * Called by the Stripe App UI to determine what sections to show or hide.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, getCorsHeaders(request));
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/plan', RATE_LIMITS.metrics);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt, getCorsHeaders(request));
  }

  const { merchantId } = await params;

  if (!isValidMerchantId(merchantId)) {
    return Response.json(
      { error: 'Invalid merchantId format' },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  try {
    const isStripeAccountId = merchantId.startsWith('acct_');
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, plan, plan_updated_at')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    const plan = normalizePlan(merchant.plan as string);
    const features = getPlanFeatures(plan);

    return Response.json(
      {
        plan,
        features,
        planUpdatedAt: merchant.plan_updated_at ?? null,
      },
      { headers: getCorsHeaders(request) }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[plan] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to load plan' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
