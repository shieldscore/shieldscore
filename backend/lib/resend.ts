import { Resend } from 'resend';

const DEFAULT_FROM = 'ShieldScore <onboarding@resend.dev>';
const PRODUCTION_FROM = 'ShieldScore <alerts@shieldscore.io>';

/**
 * Resolved "from" address for outbound emails.
 * Uses EMAIL_FROM env var if set, otherwise falls back to the Resend dev address.
 * Set EMAIL_FROM to the production address once the shieldscore.io domain is verified in Resend.
 */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM;
}

/** Production from address, exported for reference in docs / DNS setup. */
export { PRODUCTION_FROM };

let _resend: Resend | null = null;

// Lazy-initialize to avoid throwing at module load during build
export const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set in environment variables');
      }
      _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return (_resend as unknown as Record<string, unknown>)[prop as string];
  },
});
