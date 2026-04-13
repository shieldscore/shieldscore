import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// TODO: Lock down to https://dashboard.stripe.com before production deploy
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
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
  const { merchantId } = await params;
  const url = new URL(request.url);
  const severity = url.searchParams.get('severity');
  const acknowledged = url.searchParams.get('acknowledged');
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);

  // Look up by UUID or stripe_account_id
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

  // Build query
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
    console.error('Failed to fetch alerts:', error);
    return Response.json(
      { error: 'Failed to fetch alerts' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return Response.json(
    { alerts: alerts ?? [] },
    { headers: CORS_HEADERS }
  );
}
