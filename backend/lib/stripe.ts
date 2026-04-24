import Stripe from 'stripe';

let _stripeLive: Stripe | null = null;
let _stripeTest: Stripe | null = null;

export type StripeMode = 'test' | 'live';

function buildClient(key: string): Stripe {
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

/**
 * Get a Stripe client bound to either the test or live platform secret.
 * Stripe App installs happen in a specific mode; we must call the Stripe API
 * with the matching platform key, or .list() returns empty results for the
 * connected account.
 *
 * live → STRIPE_SECRET_KEY (required)
 * test → STRIPE_SECRET_KEY_TEST (required once any test-mode merchant installs)
 */
export function getStripeClient(mode: StripeMode = 'live'): Stripe {
  if (mode === 'test') {
    if (!_stripeTest) {
      const key = process.env.STRIPE_SECRET_KEY_TEST;
      if (!key) {
        throw new Error(
          'STRIPE_SECRET_KEY_TEST is not set. Add your platform test-mode secret (sk_test_...) to Vercel env vars.'
        );
      }
      _stripeTest = buildClient(key);
    }
    return _stripeTest;
  }

  if (!_stripeLive) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripeLive = buildClient(key);
  }
  return _stripeLive;
}

// Back-compat default export: live mode.
// Prefer getStripeClient(mode) in new code.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripeClient('live') as unknown as Record<string, unknown>)[prop as string];
  },
});
