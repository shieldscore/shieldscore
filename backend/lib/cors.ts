/**
 * CORS headers for Stripe App API routes.
 *
 * Stripe Apps run in a sandboxed iframe. Depending on how Stripe serves the
 * embedded dashboard, the request Origin can be any of:
 *   - 'null'                              (opaque sandbox origin)
 *   - 'https://dashboard.stripe.com'
 *   - 'https://*.stripe.com'              (regional / preview subdomains)
 *
 * We echo back the requesting origin when it matches one of these forms, which
 * is required because Access-Control-Allow-Origin cannot be '*' when the
 * request carries credentials or when browsers enforce strict matching.
 *
 * Note: the Stripe App SDK does not provide a mechanism to bypass CORS. The
 * fetchStripeSignature() helper returns a JWT that we send as a request header
 * for server-side verification; the underlying fetch is still cross-origin.
 *
 * Security: the Authorization Bearer key is the primary auth gate. CORS is
 * defense-in-depth, not the sole control.
 */

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://dashboard.stripe.com',
  'null', // Stripe App sandbox iframe with opaque origin
]);

const STRIPE_ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)*stripe\.com$/i;

function isAllowedOrigin(origin: string): boolean {
  if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;
  return STRIPE_ORIGIN_RE.test(origin);
}

/**
 * Build CORS headers based on the request's Origin.
 * Echoes allowed origins; falls back to dashboard.stripe.com for unknown ones.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://dashboard.stripe.com';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-api-key, Stripe-Signature',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/**
 * Handle OPTIONS preflight request. Always returns 204 with CORS headers.
 */
export function handlePreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
