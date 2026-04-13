import { supabase } from '@/lib/supabase';
import { detectAnomalies } from '@/lib/velocity';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/velocity/[merchantId]
 *
 * Returns velocity anomaly detection report using Z-score analysis.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;

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

  const report = await detectAnomalies(merchant.id as string);

  return Response.json(report, { headers: CORS_HEADERS });
}
