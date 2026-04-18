import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

const FORWARD_TO = 'shieldscoreapp@gmail.com';

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    console.log('[inbound-email] Raw payload:', rawBody.slice(0, 2000));

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error('[inbound-email] Failed to parse JSON');
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Resend wraps inbound emails in { type, created_at, data: { ... } }
    const data = (body.data || body) as Record<string, unknown>;
    console.log('[inbound-email] Top-level keys:', Object.keys(body));
    console.log('[inbound-email] Data keys:', Object.keys(data));

    // Extract fields -- try multiple possible field names
    const from = (data.from as string) || 'unknown@unknown.com';
    const to = (data.to as string[]) || ['hello@shieldscore.io'];
    const subject = (data.subject as string) || '';
    const text = (data.text as string) || (data.plain_text as string) || (data.body as string) || '';
    const html = (data.html as string) || (data.html_body as string) || '';

    console.log('[inbound-email] Extracted -- from:', from, 'subject:', subject, 'text length:', text.length, 'html length:', html.length);

    // DEBUG: dump all data keys and values into the email so we can see what Resend sends
    const debugInfo = Object.entries(data).map(([key, val]) => {
      const valStr = typeof val === 'string' ? val.slice(0, 200) : JSON.stringify(val)?.slice(0, 200);
      return `<strong>${escapeHtml(key)}:</strong> <code>${escapeHtml(valStr || '(null)')}</code>`;
    }).join('<br>');

    // Build the forwarded body
    const bodyContent = html || text.replace(/\n/g, '<br>') || '(no body found)';
    const forwardedHtml = `
      <div style="font-family: sans-serif; color: #333;">
        <div style="padding: 12px; background: #f5f5f5; border-left: 3px solid #6366f1; margin-bottom: 16px;">
          <strong>From:</strong> ${escapeHtml(from)}<br>
          <strong>To:</strong> ${escapeHtml(Array.isArray(to) ? to.join(', ') : String(to))}<br>
          <strong>Subject:</strong> ${escapeHtml(subject)}
        </div>
        <div>${bodyContent}</div>
        <hr>
        <div style="padding: 12px; background: #fff3cd; border: 1px solid #ffc107; margin-top: 16px; font-size: 12px;">
          <strong>DEBUG - Raw Resend payload fields (remove after fixing):</strong><br><br>
          ${debugInfo}
        </div>
      </div>
    `;

    const forwardedText = [
      '--- Forwarded email ---',
      `From: ${from}`,
      `To: ${Array.isArray(to) ? to.join(', ') : to}`,
      `Subject: ${subject}`,
      '---',
      '',
      text || '(empty body)',
    ].join('\n');

    console.log('[inbound-email] Forwarding to:', FORWARD_TO);
    const result = await resend.emails.send({
      from: 'ShieldScore <hello@shieldscore.io>',
      to: FORWARD_TO,
      subject: subject ? `[Fwd] ${subject}` : '[Fwd] (no subject)',
      html: forwardedHtml,
      text: forwardedText,
      replyTo: [from],
    });
    console.log('[inbound-email] Sent:', JSON.stringify(result));

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
