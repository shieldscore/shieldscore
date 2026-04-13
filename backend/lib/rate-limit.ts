/**
 * In-memory rate limiter for API routes.
 *
 * Tracks request counts per IP address within a sliding time window.
 * Good enough for MVP on a single Vercel instance. For production at
 * scale, replace with Redis (Upstash) or Vercel's Edge middleware.
 *
 * Note: On serverless, each cold start gets a fresh map. This means
 * rate limiting is best-effort, not bulletproof. It still blocks
 * burst abuse within a warm instance's lifetime.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupIfNeeded(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request from the given IP is within the rate limit.
 *
 * @param ip - Client IP address (or other identifier)
 * @param route - Route identifier for per-route limits (e.g., "/api/metrics")
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  ip: string,
  route: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupIfNeeded();

  const key = `${route}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request in this window or window expired
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Return a 429 Too Many Requests response.
 */
export function rateLimitResponse(
  resetAt: number,
  corsHeaders: Record<string, string> = {}
): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Extract client IP from request headers.
 * Vercel sets x-forwarded-for; falls back to x-real-ip or 'unknown'.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Pre-configured rate limit configs per route category.
 */
export const RATE_LIMITS = {
  onboard: { limit: 5, windowSeconds: 60 },
  metrics: { limit: 30, windowSeconds: 60 },
  alerts: { limit: 30, windowSeconds: 60 },
  disputes: { limit: 30, windowSeconds: 60 },
  velocity: { limit: 30, windowSeconds: 60 },
  remediation: { limit: 30, windowSeconds: 60 },
  settings: { limit: 30, windowSeconds: 60 },
  export: { limit: 5, windowSeconds: 60 },
  webhooks: { limit: 100, windowSeconds: 60 },
} as const;
