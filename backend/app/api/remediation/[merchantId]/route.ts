import { supabase } from '@/lib/supabase';
import { generateRemediationPlan } from '@/lib/remediation';
import { verifyRequest, unauthorizedResponse } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCT_RE = /^acct_[a-zA-Z0-9]{8,}$/;
function isValidMerchantId(id: string): boolean {
  return UUID_RE.test(id) || ACCT_RE.test(id);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://dashboard.stripe.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/remediation/[merchantId]
 *
 * Returns a full remediation plan based on the merchant's current metrics.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, CORS_HEADERS);
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/remediation', RATE_LIMITS.remediation);
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetAt, CORS_HEADERS);
  }

  const { merchantId } = await params;

  if (!isValidMerchantId(merchantId)) {
    return Response.json(
      { error: 'Invalid merchantId format' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const isStripeAccountId = merchantId.startsWith('acct_');
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (!merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const internalId = merchant.id as string;

    const { data: latestMetrics } = await supabase
      .from('daily_metrics')
      .select('dispute_ratio, fraud_ratio, decline_rate, health_score, total_disputes, total_charges')
      .eq('merchant_id', internalId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const { count: restrictionCount } = await supabase
      .from('restrictions')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', internalId)
      .eq('resolved', false);

    const plan = generateRemediationPlan({
      disputeRatio: Number(latestMetrics?.dispute_ratio ?? 0),
      fraudRatio: Number(latestMetrics?.fraud_ratio ?? 0),
      declineRate: Number(latestMetrics?.decline_rate ?? 0),
      healthScore: Number(latestMetrics?.health_score ?? 100),
      totalDisputes: Number(latestMetrics?.total_disputes ?? 0),
      totalCharges: Number(latestMetrics?.total_charges ?? 0),
      hasRestrictions: (restrictionCount ?? 0) > 0,
    });

    return Response.json(plan, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[remediation] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to generate remediation plan' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
