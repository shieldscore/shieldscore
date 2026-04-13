import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Lightweight health check endpoint for monitoring uptime.
 * Checks database connectivity via a simple query.
 *
 * Returns:
 *   200 { status: 'ok', timestamp, database: 'connected' }
 *   503 { status: 'degraded', timestamp, database: 'down', error: '...' }
 */
export async function GET(): Promise<Response> {
  const timestamp = new Date().toISOString();

  try {
    // Simple connectivity check — count merchants (head: true = no data transfer)
    const { error } = await supabase
      .from('merchants')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[health] Supabase query failed:', error.message);
      return Response.json(
        {
          status: 'degraded',
          timestamp,
          database: 'down',
          error: 'Database query failed',
        },
        { status: 503 }
      );
    }

    return Response.json({
      status: 'ok',
      timestamp,
      database: 'connected',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[health] Health check failed:', message);
    return Response.json(
      {
        status: 'degraded',
        timestamp,
        database: 'down',
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}
