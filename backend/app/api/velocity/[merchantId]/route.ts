import { supabase } from '@/lib/supabase';
import { detectAnomalies } from '@/lib/velocity';
import { verifyRequest, unauthorizedResponse } from '@/lib/api-auth';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { getCorsHeaders, handlePreflight } from '@/lib/cors';

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
 * GET /api/velocity/[merchantId]
 *
 * Returns velocity anomaly detection report using Z-score analysis.
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
  const rl = checkRateLimit(ip, '/api/velocity', RATE_LIMITS.velocity);
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
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (!merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: getCorsHeaders(request) }
      );
    }

    const report = await detectAnomalies(merchant.id as string);

    return Response.json(report, { headers: getCorsHeaders(request) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[velocity] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to load velocity data' },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
