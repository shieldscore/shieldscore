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
 * Escape a CSV field value. Wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/export/[merchantId]?days=90
 *
 * Generates a CSV export of the merchant's metric history.
 * Query params:
 *   - days: number of days to export (default 90, max 365)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  // Export supports auth via header OR query param (for direct link downloads
  // from the Stripe App where custom headers can't be attached to Link hrefs).
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    const apiKey = process.env.API_SECRET_KEY;
    if (!apiKey || !tokenParam || tokenParam !== apiKey) {
      return unauthorizedResponse(auth.error!, CORS_HEADERS);
    }
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/export', RATE_LIMITS.export);
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
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const days = Math.min(Math.max(parseInt(daysParam ?? '90', 10) || 90, 1), 365);

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
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: rows, error } = await supabase
      .from('daily_metrics')
      .select('date, total_charges, total_disputes, total_fraud_warnings, total_refunds, total_declines, dispute_ratio, fraud_ratio, decline_rate, health_score')
      .eq('merchant_id', internalId)
      .gte('date', startDate)
      .order('date', { ascending: true });

    if (error) {
      console.error(`[export] Supabase query failed for ${merchantId}:`, error.message);
      return Response.json(
        { error: 'Failed to fetch metrics' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    // Build CSV
    const header = 'Date,Total Charges,Total Disputes,Total Fraud Warnings,Total Refunds,Total Declines,Dispute Ratio,Fraud Ratio,Decline Rate,Health Score';

    const csvRows = (rows ?? []).map((row) =>
      [
        escapeCSV(String(row.date)),
        escapeCSV(Number(row.total_charges)),
        escapeCSV(Number(row.total_disputes)),
        escapeCSV(Number(row.total_fraud_warnings)),
        escapeCSV(Number(row.total_refunds)),
        escapeCSV(Number(row.total_declines)),
        escapeCSV((Number(row.dispute_ratio) * 100).toFixed(4)),
        escapeCSV((Number(row.fraud_ratio) * 100).toFixed(4)),
        escapeCSV((Number(row.decline_rate) * 100).toFixed(4)),
        escapeCSV(Number(row.health_score)),
      ].join(',')
    );

    const csv = [header, ...csvRows].join('\n');
    const today = new Date().toISOString().split('T')[0];

    return new Response(csv, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="shieldscore-export-${today}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[export] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Export failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
