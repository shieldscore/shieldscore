import { supabase } from '@/lib/supabase';
import { checkAndSendAlerts, sendVelocityAlert } from '@/lib/alerts';
import { detectAnomalies } from '@/lib/velocity';
import { syncMerchantMetrics } from '@/lib/sync-merchant';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/sync-merchant/[merchantId]
 *
 * Syncs metrics for a SINGLE merchant. Called by the daily-sync dispatcher.
 * Each merchant gets its own function invocation and its own timeout budget.
 *
 * Protected by CRON_SECRET — same as the dispatcher.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantId: string }> }
): Promise<Response> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { merchantId } = await params;

  // Fetch merchant
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id, stripe_account_id, email, phone, alert_preferences, plan')
    .eq('id', merchantId)
    .single();

  if (merchantError || !merchant) {
    return Response.json(
      { error: 'Merchant not found', merchantId },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
  );

  try {
    const metrics = await syncMerchantMetrics(
      merchant.id,
      merchant.stripe_account_id,
      thirtyDaysAgo,
      today
    );

    // Check and send alerts
    const prefs = merchant.alert_preferences ?? {
      email: true,
      slack: false,
      sms: false,
    };

    const merchantPlan = (merchant.plan as string) ?? 'free';

    await checkAndSendAlerts({
      merchantId: merchant.id,
      plan: merchantPlan,
      email: merchant.email,
      phone: merchant.phone ?? null,
      vampRatio: metrics.vampRatio,
      mcDisputeRatio: metrics.mcDisputeRatio,
      declineRate: metrics.declineRate,
      healthScore: metrics.healthScore,
      totalCharges: metrics.totalCharges,
      totalDisputes: metrics.totalDisputes,
      totalFraudWarnings: metrics.totalFraudWarnings,
      totalDeclines: metrics.totalDeclines,
      totalAttempts: metrics.totalAttempts,
      hasRestrictions: metrics.hasRestrictions,
      requirements: [],
      capabilities: [],
      alertPreferences: prefs,
    });

    // Velocity anomaly detection
    const anomalyReport = await detectAnomalies(merchant.id);
    if (anomalyReport.overallStatus !== 'normal') {
      await sendVelocityAlert(
        merchant.id,
        merchant.email,
        merchant.phone ?? null,
        prefs,
        anomalyReport,
        merchantPlan
      );
    }

    return Response.json({
      merchantId: merchant.id,
      stripeAccountId: merchant.stripe_account_id,
      status: 'success',
      healthScore: metrics.healthScore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[sync-merchant] Failed for ${merchant.stripe_account_id}:`,
      message
    );
    return Response.json(
      {
        merchantId: merchant.id,
        stripeAccountId: merchant.stripe_account_id,
        status: 'error',
        error: message,
      },
      { status: 500 }
    );
  }
}

