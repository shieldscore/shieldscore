import { supabase } from './supabase';
import { resend } from './resend';
import { getTriggeredAlerts } from './calculations';

interface AlertInput {
  merchantId: string;
  email: string | null;
  vampRatio: number;
  mcDisputeRatio: number;
  declineRate: number;
  hasRestrictions: boolean;
  alertPreferences: { email: boolean; slack: boolean; sms: boolean };
}

/**
 * Check metrics against thresholds and send alerts if needed.
 * Deduplicates by checking if the same alert type + severity
 * was already sent in the last 24 hours.
 */
export async function checkAndSendAlerts(input: AlertInput): Promise<void> {
  const triggered = getTriggeredAlerts(
    input.vampRatio,
    input.mcDisputeRatio,
    input.declineRate,
    input.hasRestrictions
  );

  if (triggered.length === 0) return;

  for (const alert of triggered) {
    // Deduplicate: skip if same alert type + severity sent in last 24h
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('merchant_id', input.merchantId)
      .eq('alert_type', alert.type)
      .eq('severity', alert.severity)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing && existing.length > 0) continue;

    const deliveredVia: string[] = [];

    // Send email alert
    if (input.alertPreferences.email && input.email) {
      try {
        await resend.emails.send({
          from: 'ShieldScore <alerts@shieldscore.com>',
          to: input.email,
          subject: `[ShieldScore ${alert.severity.toUpperCase()}] ${alert.title}`,
          html: `
            <h2>${alert.title}</h2>
            <p>${alert.message}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">View Dashboard</a></p>
          `,
        });
        deliveredVia.push('email');
      } catch (err) {
        console.error('Failed to send email alert:', err);
      }
    }

    // Store alert in database
    await supabase.from('alerts').insert({
      merchant_id: input.merchantId,
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      delivered_via: deliveredVia,
    });
  }
}
