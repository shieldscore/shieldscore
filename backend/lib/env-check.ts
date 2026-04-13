/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are set at runtime.
 * Called once on server startup (module-level side effect).
 *
 * - Required vars: throws if missing (except during `next build`)
 * - Optional vars: logs a warning if missing
 */

const REQUIRED_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'CRON_SECRET',
] as const;

const OPTIONAL_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'API_SECRET_KEY',
  'STRIPE_ACCOUNT_ID',
  'EMAIL_FROM',
] as const;

/**
 * Run env validation. Safe to call multiple times (idempotent log output).
 *
 * During `next build` (process.env.NODE_ENV may be 'production' but
 * NEXT_PHASE is 'phase-production-build'), we only warn — throwing
 * would break the build when env vars are injected at runtime by Vercel.
 */
export function validateEnv(): void {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  const missing: string[] = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = `[env-check] Missing required environment variables: ${missing.join(', ')}`;
    if (isBuildPhase) {
      console.warn(message + ' (build phase — will be checked at runtime)');
    } else {
      throw new Error(message);
    }
  }

  const missingOptional: string[] = [];
  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `[env-check] Missing optional environment variables: ${missingOptional.join(', ')}. ` +
        'Related features will be disabled.'
    );
  }
}

// Auto-validate on first import
validateEnv();
