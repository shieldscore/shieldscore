import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts/[merchantId]
 *
 * Returns alert history for a merchant.
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

  // Validate merchant exists
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .single();

  if (!merchant) {
    return Response.json({ error: 'Merchant not found' }, { status: 404 });
  }

  // Build query
  let query = supabase
    .from('alerts')
    .select('*')
    .eq('merchant_id', merchantId)
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
    return Response.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }

  // Also get count of unacknowledged alerts
  const { count: unacknowledgedCount } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .eq('acknowledged', false);

  return Response.json({
    merchantId,
    alerts: alerts ?? [],
    unacknowledgedCount: unacknowledgedCount ?? 0,
  });
}
