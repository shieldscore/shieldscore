import { supabase } from './supabase';
import { resend, getEmailFrom } from './resend';
import { getTriggeredAlerts, THRESHOLDS, ALERT_THRESHOLDS } from './calculations';
import {
  thresholdWarning,
  restrictionDetected,
  vampCritical,
  declineRateWarning,
  type EmailOutput,
} from './email-templates';
import { sendSMS } from './twilio';
import {
  thresholdSMS,
  restrictionSMS,
  vampCriticalSMS,
  declineRateSMS,
  velocitySpikeSMS,
} from './sms-templates';
import { velocitySpike } from './email-templates';
import type { AnomalyReport } from './velocity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlertPreferences {
  email: boolean;
  slack: boolean;
  sms: boolean;
}

interface AlertInput {
  merchantId: string;
  email: string | null;
  phone: string | null;
  vampRatio: number;
  mcDisputeRatio: number;
  declineRate: number;
  healthScore: number;
  totalCharges: number;
  totalDisputes: number;
  totalFraudWarnings: number;
  totalDeclines: number;
  totalAttempts: number;
  hasRestrictions: boolean;
  requirements: string[];
  capabilities: string[];
  alertPreferences: AlertPreferences;
}

interface RestrictionAlertInput {
  merchantId: string;
  email: string | null;
  phone: string | null;
  requirements: string[];
  capabilities: string[];
  alertPreferences: AlertPreferences;
}

// ---------------------------------------------------------------------------
// Template resolver
// ---------------------------------------------------------------------------

/**
 * Pick the right email template based on the triggered alert and input data.
 */
function resolveTemplate(
  alertType: string,
  severity: 'info' | 'warning' | 'critical',
  input: AlertInput
): EmailOutput | null {
  const email = input.email;
  if (!email) return null;

  // VAMP critical — specific template for the worst case
  if (alertType === 'threshold_warning' && severity === 'critical' && input.vampRatio >= THRESHOLDS.VISA_VAMP) {
    return vampCritical({
      vampRatio: input.vampRatio,
      fraudWarnings: input.totalFraudWarnings,
      disputes: input.totalDisputes,
      totalCharges: input.totalCharges,
      healthScore: input.healthScore,
      merchantEmail: email,
    });
  }

  // Decline rate alerts
  if (alertType === 'threshold_warning' && input.declineRate >= ALERT_THRESHOLDS.DECLINE_WARNING) {
    return declineRateWarning({
      declineRate: input.declineRate,
      declines: input.totalDeclines,
      totalAttempts: input.totalAttempts,
      merchantEmail: email,
    });
  }

  // Restriction detected
  if (alertType === 'restriction_detected') {
    return restrictionDetected({
      requirements: input.requirements,
      capabilities: input.capabilities,
      merchantEmail: email,
    });
  }

  // Generic threshold warning (dispute ratio approaching / warning / CMM zone)
  if (alertType === 'threshold_warning') {
    const maxRatio = Math.max(input.vampRatio, input.mcDisputeRatio);
    let thresholdName: string;
    let thresholdValue: number;

    if (maxRatio >= ALERT_THRESHOLDS.PENALTY_ZONE) {
      thresholdName = 'Visa VAMP / Mastercard ECM';
      thresholdValue = THRESHOLDS.VISA_VAMP;
    } else if (maxRatio >= ALERT_THRESHOLDS.CMM_ZONE) {
      thresholdName = 'Mastercard CMM';
      thresholdValue = THRESHOLDS.MASTERCARD_CMM;
    } else {
      thresholdName = 'Mastercard CMM';
      thresholdValue = THRESHOLDS.MASTERCARD_CMM;
    }

    return thresholdWarning({
      ratio: maxRatio,
      threshold: thresholdName,
      thresholdValue,
      healthScore: input.healthScore,
      merchantEmail: email,
    });
  }

  return null;
}

// ---------------------------------------------------------------------------
// SMS resolver
// ---------------------------------------------------------------------------

/**
 * Pick the right SMS message based on the triggered alert and input data.
 */
function resolveSMSMessage(
  alertType: string,
  severity: 'info' | 'warning' | 'critical',
  input: AlertInput
): string | null {
  // Only send SMS for warning or critical alerts
  if (severity === 'info') return null;

  if (alertType === 'threshold_warning' && severity === 'critical' && input.vampRatio >= THRESHOLDS.VISA_VAMP) {
    return vampCriticalSMS(input.vampRatio);
  }

  if (alertType === 'threshold_warning' && input.declineRate >= ALERT_THRESHOLDS.DECLINE_WARNING) {
    return declineRateSMS(input.declineRate);
  }

  if (alertType === 'restriction_detected') {
    return restrictionSMS();
  }

  if (alertType === 'threshold_warning') {
    const maxRatio = Math.max(input.vampRatio, input.mcDisputeRatio);
    const thresholdName = maxRatio >= ALERT_THRESHOLDS.PENALTY_ZONE
      ? 'ECM/VAMP'
      : 'CMM';
    return thresholdSMS(maxRatio, thresholdName);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core alert functions
// ---------------------------------------------------------------------------

/**
 * Send an email alert using the resolved template.
 * Returns true if the email was sent.
 */
async function sendAlertEmail(
  to: string,
  template: EmailOutput
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: getEmailFrom(),
      to,
      subject: template.subject,
      html: template.html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send email alert:', err);
    return false;
  }
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
      const template = resolveTemplate(alert.type, alert.severity, input);
      if (template) {
        const sent = await sendAlertEmail(input.email, template);
        if (sent) deliveredVia.push('email');
      }
    }

    // Send SMS alert (warning and critical only, if enabled)
    if (
      input.alertPreferences.sms &&
      input.phone &&
      (alert.severity === 'warning' || alert.severity === 'critical')
    ) {
      const smsMessage = resolveSMSMessage(alert.type, alert.severity, input);
      if (smsMessage) {
        const sent = await sendSMS(input.phone, smsMessage);
        if (sent) deliveredVia.push('sms');
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

/**
 * Send a restriction-specific alert. Called directly from the webhook handler
 * when account.updated fires with new requirements or capability changes.
 */
export async function sendRestrictionAlert(input: RestrictionAlertInput): Promise<void> {
  const hasEmail = input.email && input.alertPreferences.email;
  const hasSMS = input.phone && input.alertPreferences.sms;
  if (!hasEmail && !hasSMS) return;
  if (input.requirements.length === 0 && input.capabilities.length === 0) return;

  // Deduplicate
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('merchant_id', input.merchantId)
    .eq('alert_type', 'restriction_detected')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) return;

  const deliveredVia: string[] = [];

  // Send email
  if (hasEmail && input.email) {
    const template = restrictionDetected({
      requirements: input.requirements,
      capabilities: input.capabilities,
      merchantEmail: input.email,
    });
    const sent = await sendAlertEmail(input.email, template);
    if (sent) deliveredVia.push('email');
  }

  // Send SMS (restrictions are always critical)
  if (hasSMS && input.phone) {
    const sent = await sendSMS(input.phone, restrictionSMS());
    if (sent) deliveredVia.push('sms');
  }

  await supabase.from('alerts').insert({
    merchant_id: input.merchantId,
    alert_type: 'restriction_detected',
    severity: 'critical' as const,
    title: 'Stripe flagged your account',
    message: `Requirements: ${input.requirements.join(', ')}. Capabilities: ${input.capabilities.join(', ')}.`,
    delivered_via: deliveredVia,
  });
}

/**
 * Send a velocity spike alert when anomaly detection finds unusual patterns.
 * Called from the daily-sync cron job after running detectAnomalies().
 */
export async function sendVelocityAlert(
  merchantId: string,
  email: string | null,
  phone: string | null,
  alertPreferences: AlertPreferences,
  report: AnomalyReport
): Promise<void> {
  if (report.overallStatus === 'normal') return;

  const hasEmail = email && alertPreferences.email;
  const hasSMS = phone && alertPreferences.sms;
  if (!hasEmail && !hasSMS) return;

  const alertSeverity: 'warning' | 'critical' =
    report.overallStatus === 'critical' ? 'critical' : 'warning';
  const templateSeverity: 'elevated' | 'critical' =
    report.overallStatus === 'critical' ? 'critical' : 'elevated';

  // Deduplicate
  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('alert_type', 'velocity_spike')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (existing && existing.length > 0) return;

  const deliveredVia: string[] = [];

  // Send email
  if (hasEmail && email) {
    const template = velocitySpike({
      currentDeclines: report.declineVelocity.current,
      averageDeclines: report.declineVelocity.mean,
      zScore: report.declineVelocity.zScore,
      currentCharges: report.chargeVelocity.current,
      averageCharges: report.chargeVelocity.mean,
      chargeZScore: report.chargeVelocity.zScore,
      severity: templateSeverity,
      merchantEmail: email,
    });
    const sent = await sendAlertEmail(email, template);
    if (sent) deliveredVia.push('email');
  }

  // Send SMS
  if (hasSMS && phone) {
    const sent = await sendSMS(
      phone,
      velocitySpikeSMS(report.declineVelocity.current, report.declineVelocity.mean)
    );
    if (sent) deliveredVia.push('sms');
  }

  await supabase.from('alerts').insert({
    merchant_id: merchantId,
    alert_type: 'velocity_spike',
    severity: alertSeverity,
    title: `Unusual transaction pattern detected (${report.overallStatus})`,
    message: report.summary,
    delivered_via: deliveredVia,
  });
}
