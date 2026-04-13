import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Daily Sync Dispatcher
 *
 * Runs once per day (triggered by Vercel Cron or external scheduler).
 * Instead of processing all merchants in a single function invocation
 * (which would timeout on Vercel's 10s free tier limit), this endpoint:
 *
 * 1. Fetches the list of all merchant IDs
 * 2. Fires off a separate function call for each merchant
 * 3. Returns immediately with the dispatch summary
 *
 * Each merchant sync runs as its own /api/cron/sync-merchant/[id] invocation
 * with its own 10-second timeout budget.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch all merchant IDs
  const { data: merchants, error: merchantError } = await supabase
    .from('merchants')
    .select('id');

  if (merchantError || !merchants) {
    console.error('[daily-sync] Failed to fetch merchants:', merchantError);
    return Response.json(
      { error: 'Failed to fetch merchants' },
      { status: 500 }
    );
  }

  if (merchants.length === 0) {
    return Response.json({
      date: new Date().toISOString().split('T')[0],
      totalMerchants: 0,
      dispatched: 0,
    });
  }

  // Build the base URL for the sync-merchant endpoint
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shieldscore.io';
  const cronSecret = process.env.CRON_SECRET || '';

  // Dispatch all merchant syncs concurrently.
  // We use fire-and-forget fetch calls — we don't wait for each to complete.
  // This keeps the dispatcher itself well within the timeout budget.
  const dispatched: string[] = [];
  const failed: Array<{ merchantId: string; error: string }> = [];

  // Dispatch in batches of 20 to avoid overwhelming the network
  const BATCH_SIZE = 20;
  for (let i = 0; i < merchants.length; i += BATCH_SIZE) {
    const batch = merchants.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (merchant) => {
        const url = `${appUrl}/api/cron/sync-merchant/${merchant.id}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cronSecret}`,
          },
        });

        if (!res.ok) {
          const body = await res.text().catch(() => 'unknown');
          throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
        }

        return merchant.id;
      })
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const merchantId = batch[j].id;
      if (result.status === 'fulfilled') {
        dispatched.push(merchantId);
      } else {
        const msg = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
        console.error(`[daily-sync] Failed to dispatch ${merchantId}:`, msg);
        failed.push({ merchantId, error: msg });
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];

  console.log(
    `[daily-sync] Dispatched ${dispatched.length}/${merchants.length} merchants, ${failed.length} failed`
  );

  return Response.json({
    date: today,
    totalMerchants: merchants.length,
    dispatched: dispatched.length,
    failed: failed.length,
    errors: failed.length > 0 ? failed : undefined,
  });
}
