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
    const rawBody = await request.text();
    console.log('[inbound-email] Received webhook:', rawBody.slice(0, 500));

    let body: ResendWebhookPayload;
    try {
      body = JSON.parse(rawBody) as ResendWebhookPayload;
    } catch {
      console.error('[inbound-email] Failed to parse JSON');
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[inbound-email] Event type:', body.type);
    console.log('[inbound-email] Data keys:', body.data ? Object.keys(body.data) : 'no data');
    console.log('[inbound-email] Full data:', JSON.stringify(body.data).slice(0, 1000));

    // Only process inbound email events
    if (body.type && body.type !== 'email.received') {
      console.log('[inbound-email] Ignoring event type:', body.type);
      return Response.json({ received: true });
    }

    const email = body.data;
    if (!email || !email.from) {
      console.error('[inbound-email] Missing required fields. Keys received:', email ? Object.keys(email) : 'no data');
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Forward the email to Gmail
    console.log('[inbound-email] Forwarding to:', FORWARD_TO);
    const result = await resend.emails.send({
      from: `ShieldScore <hello@shieldscore.io>`,
      to: FORWARD_TO,
      subject: `[Fwd] ${email.subject || '(no subject)'}`,
      html: buildForwardedHtml(email),
      text: buildForwardedText(email),
      replyTo: [email.from],
    });
    console.log('[inbound-email] Forward sent successfully:', JSON.stringify(result));

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
