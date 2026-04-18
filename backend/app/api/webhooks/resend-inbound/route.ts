import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

const FORWARD_TO = 'shieldscoreapp@gmail.com';

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const data = (body.data || body) as Record<string, unknown>;
    const from = (data.from as string) || 'unknown@unknown.com';
    const to = (data.to as string[]) || ['hello@shieldscore.io'];
    const subject = (data.subject as string) || '';
    const emailId = data.email_id as string;

    // Fetch the full email content from Resend API using the email_id
    let emailBody = '';
    if (emailId) {
      try {
        const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        });
        if (res.ok) {
          const fullEmail = await res.json() as Record<string, unknown>;
          emailBody = (fullEmail.html as string) || (fullEmail.text as string) || (fullEmail.body as string) || '';
        }
      } catch (err) {
        console.error('[inbound-email] Failed to fetch email content:', err);
      }
    }

    // If API fetch didn't return body, use what we have
    if (!emailBody) {
      emailBody = (data.html as string) || (data.text as string) || (data.body as string) || '';
    }

    const bodyContent = emailBody || '(no body)';
    const isHtml = bodyContent.includes('<') && bodyContent.includes('>');

    const forwardedHtml = `
      <div style="font-family: sans-serif; color: #333;">
        <div style="padding: 12px; background: #f5f5f5; border-left: 3px solid #6366f1; margin-bottom: 16px;">
          <strong>From:</strong> ${escapeHtml(from)}<br>
          <strong>To:</strong> ${escapeHtml(Array.isArray(to) ? to.join(', ') : String(to))}<br>
          <strong>Subject:</strong> ${escapeHtml(subject)}
        </div>
        <div>${isHtml ? bodyContent : escapeHtml(bodyContent).replace(/\n/g, '<br>')}</div>
      </div>
    `;

    const forwardedText = [
      '--- Forwarded email ---',
      `From: ${from}`,
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
      `Subject: ${subject}`,
      '---',
      '',
      isHtml ? '(see HTML version)' : bodyContent,
    ].join('\n');

    const result = await resend.emails.send({
      from: 'ShieldScore <hello@shieldscore.io>',
      to: FORWARD_TO,
      subject: subject ? `[Fwd] ${subject}` : '[Fwd] (no subject)',
      html: forwardedHtml,
      text: forwardedText,
      replyTo: [from],
    });
    console.log('[inbound-email] Forwarded:', from, '->', FORWARD_TO, 'id:', JSON.stringify(result));

    return Response.json({ received: true });
  } catch (error) {
    console.error('[inbound-email] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
