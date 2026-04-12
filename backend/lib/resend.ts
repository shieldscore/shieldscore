import { Resend } from 'resend';

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
