import { supabase } from '@/lib/supabase';
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
 * GET /api/alerts/[merchantId]
 *
 * Returns alert history for a merchant.
 * Response shape: { alerts: Alert[] }
 *
 * Supports query params:
 * - severity: filter by severity (info, warning, critical)
 * - limit: number of alerts to return (default 20, max 100)
 * - acknowledged: filter by acknowledged status (true/false)
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
  const rl = checkRateLimit(ip, '/api/alerts', RATE_LIMITS.alerts);
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
  const url = new URL(request.url);
  const severity = url.searchParams.get('severity');
  if (severity && !['info', 'warning', 'critical'].includes(severity)) {
    return Response.json(
      { error: 'Invalid severity. Must be info, warning, or critical.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  const acknowledged = url.searchParams.get('acknowledged');
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);

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

    let query = supabase
      .from('alerts')
      .select('id, alert_type, severity, title, message, acknowledged, created_at')
      .eq('merchant_id', internalId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error(`[alerts] Supabase query failed for ${merchantId}:`, error.message);
      return Response.json(
        { error: 'Failed to fetch alerts' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      { alerts: alerts ?? [] },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[alerts] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to fetch alerts' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
