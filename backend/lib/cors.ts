/**
 * CORS headers for Stripe App API routes.
 *
 * Stripe Apps run in a sandboxed iframe whose origin is either:
 * - 'null' (opaque origin from the sandbox)
 * - 'https://dashboard.stripe.com' (some Stripe preview contexts)
 *
 * Since the sandbox origin is opaque ('null'), we can't match it with a
 * specific Allow-Origin value. We use a dynamic approach: check the
 * request's Origin header and only allow known-safe values.
 *
 * Security: The API key in the Authorization header is the primary auth
 * mechanism. CORS is defense-in-depth, not the sole gate.
 */

const ALLOWED_ORIGINS = new Set([
  'https://dashboard.stripe.com',
  'null', // Stripe App sandbox iframe
]);

/**
 * Build CORS headers based on the request's Origin.
 * Returns wildcard-free headers — only echoes back allowed origins.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://dashboard.stripe.com';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Handle OPTIONS preflight request.
 */
export function handlePreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}
