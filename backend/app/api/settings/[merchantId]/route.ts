import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// TODO: Lock down to https://dashboard.stripe.com before production deploy
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
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
  _request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  const { merchantId } = await params;

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
  const { merchantId } = await params;

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

  // Look up merchant
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

  // Build update payload
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
    console.error('Failed to update settings:', error);
    return Response.json(
      { error: 'Failed to update settings' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return Response.json(
    { success: true },
    { headers: CORS_HEADERS }
  );
}
