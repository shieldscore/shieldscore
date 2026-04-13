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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

interface SettingsPayload {
  phone?: string | null;
  alertPreferences?: {
    email?: boolean;
    slack?: boolean;
    sms?: boolean;
  };
}

/**
 * GET /api/settings/[merchantId]
 *
 * Returns current settings (phone, alert preferences) for a merchant.
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
  const rl = checkRateLimit(ip, '/api/settings', RATE_LIMITS.settings);
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
      .select('phone, alert_preferences')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (!merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      {
        phone: merchant.phone ?? null,
        alertPreferences: merchant.alert_preferences ?? {
          email: true,
          slack: false,
          sms: false,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[settings GET] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to load settings' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/settings/[merchantId]
 *
 * Updates merchant settings: phone number and alert preferences.
 * Body: { phone?: string | null, alertPreferences?: { email, slack, sms } }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const auth = verifyRequest(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error!, CORS_HEADERS);
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, '/api/settings', RATE_LIMITS.settings);
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

  let body: SettingsPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Validate phone format if provided
  if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
    if (!body.phone.startsWith('+') || body.phone.length < 10) {
      return Response.json(
        { error: 'Phone number must start with + and include country code (e.g., +14155551234)' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  try {
    const isStripeAccountId = merchantId.startsWith('acct_');
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, alert_preferences')
      .eq(isStripeAccountId ? 'stripe_account_id' : 'id', merchantId)
      .single();

    if (!merchant) {
      return Response.json(
        { error: 'Merchant not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const internalId = merchant.id as string;

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.phone !== undefined) {
      update.phone = body.phone || null;
    }

    if (body.alertPreferences) {
      const currentPrefs = (merchant.alert_preferences as Record<string, boolean>) ?? {
        email: true,
        slack: false,
        sms: false,
      };
      update.alert_preferences = {
        ...currentPrefs,
        ...body.alertPreferences,
      };
    }

    const { error } = await supabase
      .from('merchants')
      .update(update)
      .eq('id', internalId);

    if (error) {
      console.error(`[settings POST] Supabase update failed for ${merchantId}:`, error.message);
      return Response.json(
        { error: 'Failed to update settings' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      { success: true },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[settings POST] Error for merchant ${merchantId}:`, message);
    return Response.json(
      { error: 'Failed to update settings' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
