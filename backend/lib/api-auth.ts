import { NextRequest } from 'next/server';

/**
 * API Authentication Middleware
 *
 * Verifies that incoming requests from the Stripe App include a valid
 * API secret key in the Authorization header.
 *
 * TODO: Migrate to Stripe App signature verification via fetchStripeSignature()
 * once STRIPE_APP_SECRET is configured. That approach cryptographically proves
 * the request came from our installed Stripe App, which is stronger than a
 * shared secret.
 */

const API_SECRET_KEY = process.env.API_SECRET_KEY;

interface AuthResult {
  authenticated: boolean;
  error?: string;
}

/**
 * Verify that a request includes a valid Bearer token matching API_SECRET_KEY.
 *
 * Returns { authenticated: true } on success, or { authenticated: false, error }
 * with a reason string on failure.
 *
 * If API_SECRET_KEY is not configured, all requests are allowed (development mode)
 * but a warning is logged on the first call.
 */
let warnedMissingKey = false;

export function verifyRequest(request: NextRequest | Request): AuthResult {
  if (!API_SECRET_KEY) {
    if (!warnedMissingKey) {
      console.warn(
        '[api-auth] API_SECRET_KEY is not set — all requests are allowed. ' +
          'Set API_SECRET_KEY in production to enforce authentication.'
      );
      warnedMissingKey = true;
    }
    return { authenticated: true };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authenticated: false, error: 'Missing Authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Authorization header must use Bearer scheme' };
  }

  const token = authHeader.slice(7);
  if (token !== API_SECRET_KEY) {
    return { authenticated: false, error: 'Invalid API key' };
  }

  return { authenticated: true };
}

/**
 * Helper to return a 401 JSON response with CORS headers.
 */
export function unauthorizedResponse(
  error: string,
  corsHeaders: Record<string, string>
): Response {
  return Response.json(
    { error },
    { status: 401, headers: corsHeaders }
  );
}
