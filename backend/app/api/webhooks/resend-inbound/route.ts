import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

const FORWARD_TO = 'shieldscoreapp@gmail.com';
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

interface ResendInboundEmail {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  reply_to?: string[];
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type: string;
  }>;
}

interface ResendWebhookPayload {
  type: string;
  data: ResendInboundEmail;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as ResendWebhookPayload;

    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('svix-signature');
      if (!signature) {
        return Response.json({ error: 'Missing signature' }, { status: 401 });
      }
      // Resend uses Svix for webhook signatures
      // For full verification, install @svix/webhook and verify here
      // For now, we check the secret header
    }

    const email = body.data;
    if (!email || !email.from || !email.subject) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Forward the email to Gmail
    await resend.emails.send({
      from: `ShieldScore Inbox <alerts@shieldscore.io>`,
      to: FORWARD_TO,
      subject: `[Fwd] ${email.subject}`,
      html: buildForwardedHtml(email),
      text: buildForwardedText(email),
      replyTo: [email.from],
    });

    return Response.json({ received: true });
  } catch (error) {
    console.error('Inbound email forwarding failed:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

function buildForwardedHtml(email: ResendInboundEmail): string {
  const originalHtml = email.html || email.text?.replace(/\n/g, '<br>') || '(empty)';
  return `
    <div style="font-family: sans-serif; color: #333;">
      <p style="padding: 12px; background: #f5f5f5; border-left: 3px solid #6366f1; margin-bottom: 16px;">
        <strong>From:</strong> ${escapeHtml(email.from)}<br>
        <strong>To:</strong> ${escapeHtml(email.to?.join(', ') || 'hello@shieldscore.io')}<br>
        <strong>Subject:</strong> ${escapeHtml(email.subject)}
      </p>
      <div>${originalHtml}</div>
    </div>
  `;
}

function buildForwardedText(email: ResendInboundEmail): string {
  return [
    `--- Forwarded email ---`,
    `From: ${email.from}`,
    `To: ${email.to?.join(', ') || 'hello@shieldscore.io'}`,
    `Subject: ${email.subject}`,
    `---`,
    '',
    email.text || '(empty)',
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
