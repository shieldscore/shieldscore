/**
 * ShieldScore HTML Email Templates
 *
 * All templates produce valid HTML email: tables for layout, inline styles only.
 * No CSS classes, no external stylesheets, no images.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThresholdWarningData {
  ratio: number;
  threshold: string;
  thresholdValue: number;
  healthScore: number;
  merchantEmail: string;
}

export interface RestrictionDetectedData {
  requirements: string[];
  capabilities: string[];
  merchantEmail: string;
}

export interface VampCriticalData {
  vampRatio: number;
  fraudWarnings: number;
  disputes: number;
  totalCharges: number;
  healthScore: number;
  merchantEmail: string;
}

export interface DeclineRateWarningData {
  declineRate: number;
  declines: number;
  totalAttempts: number;
  merchantEmail: string;
}

export interface DailyDigestData {
  healthScore: number;
  disputeRatio: number;
  fraudRatio: number;
  declineRate: number;
  disputeRatioDelta: number;
  fraudRatioDelta: number;
  alertCount: number;
  merchantEmail: string;
}

export interface EmailOutput {
  subject: string;
  html: string;
}

// ---------------------------------------------------------------------------
// Color constants
// ---------------------------------------------------------------------------

const COLORS = {
  red: '#dc2626',
  amber: '#d97706',
  blue: '#2563eb',
  gray: '#6b7280',
  green: '#16a34a',
  lightGray: '#f3f4f6',
  darkText: '#111111',
  mutedText: '#6b7280',
  white: '#ffffff',
} as const;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function pct(value: number, decimals = 2): string {
  return (value * 100).toFixed(decimals);
}

function healthColor(score: number): string {
  if (score >= 70) return COLORS.green;
  if (score >= 40) return COLORS.amber;
  return COLORS.red;
}

function borderColor(type: 'critical' | 'warning' | 'info' | 'digest'): string {
  switch (type) {
    case 'critical':
      return COLORS.red;
    case 'warning':
      return COLORS.amber;
    case 'info':
      return COLORS.blue;
    case 'digest':
      return COLORS.gray;
  }
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td style="background-color:${COLORS.darkText};border-radius:6px;padding:12px 24px;">
          <a href="${href}" target="_blank" style="color:${COLORS.white};font-family:'DM Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function bigNumber(value: string, color?: string): string {
  const c = color || COLORS.darkText;
  return `<div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:${c};line-height:1.2;padding:8px 0;">${value}</div>`;
}

function wrap(topBorderColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${COLORS.lightGray};font-family:'DM Sans',Arial,Helvetica,sans-serif;color:${COLORS.darkText};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.lightGray};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:8px;overflow:hidden;">
          <!-- Top border -->
          <tr><td style="height:4px;background-color:${topBorderColor};font-size:0;line-height:0;">&nbsp;</td></tr>
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="font-size:20px;font-weight:700;color:${COLORS.darkText};font-family:'DM Sans',Arial,sans-serif;">ShieldScore</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 32px 32px;font-size:15px;line-height:1.6;color:${COLORS.darkText};">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px 32px;border-top:1px solid ${COLORS.lightGray};">
              <div style="font-size:12px;color:${COLORS.mutedText};line-height:1.5;">
                You received this because you installed ShieldScore on your Stripe account.<br>
                <a href="https://dashboard.stripe.com" target="_blank" style="color:${COLORS.mutedText};text-decoration:underline;">Open Stripe Dashboard</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Template A: Threshold Warning
// ---------------------------------------------------------------------------

export function thresholdWarning(data: ThresholdWarningData): EmailOutput {
  const ratioStr = pct(data.ratio);
  const thresholdStr = pct(data.thresholdValue);
  const distance = Math.abs(data.thresholdValue - data.ratio);
  const distanceStr = pct(distance);
  const isAboveCmm = data.ratio >= 0.01;
  const topColor = isAboveCmm ? borderColor('critical') : borderColor('warning');
  const numberColor = isAboveCmm ? COLORS.red : COLORS.amber;

  const body = `
    ${bigNumber(`${ratioStr}%`, numberColor)}
    <p style="margin:16px 0 8px 0;">Your dispute ratio is <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${ratioStr}%</span>. The ${data.threshold} threshold is <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${thresholdStr}%</span>.</p>
    <p style="margin:0 0 8px 0;">You are <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${distanceStr}%</span> away from ${data.threshold}.</p>
    <p style="margin:0 0 8px 0;">Health score: <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.healthScore}</span>/100</p>
    <p style="margin:16px 0 0 0;">Review your recent disputes in the Stripe Dashboard.</p>
    ${button('Open Stripe Dashboard', 'https://dashboard.stripe.com/disputes')}`;

  return {
    subject: `Dispute ratio at ${ratioStr}%`,
    html: wrap(topColor, body),
  };
}

// ---------------------------------------------------------------------------
// Template B: Restriction Detected
// ---------------------------------------------------------------------------

export function restrictionDetected(data: RestrictionDetectedData): EmailOutput {
  let listHtml = '';

  if (data.requirements.length > 0) {
    const items = data.requirements
      .map((r) => `<li style="margin-bottom:4px;">${r}</li>`)
      .join('');
    listHtml += `
      <p style="margin:16px 0 8px 0;font-weight:600;">Pending requirements:</p>
      <ul style="margin:0 0 8px 0;padding-left:20px;">${items}</ul>`;
  }

  if (data.capabilities.length > 0) {
    const items = data.capabilities
      .map((c) => `<li style="margin-bottom:4px;">${c}</li>`)
      .join('');
    listHtml += `
      <p style="margin:16px 0 8px 0;font-weight:600;">Capability changes:</p>
      <ul style="margin:0 0 8px 0;padding-left:20px;">${items}</ul>`;
  }

  const body = `
    <p style="margin:0 0 8px 0;">Stripe added new requirements to your account.</p>
    ${listHtml}
    <p style="margin:16px 0 0 0;">Complete any pending requirements immediately to avoid processing interruptions.</p>
    ${button('Open Account Settings', 'https://dashboard.stripe.com/settings/account')}`;

  return {
    subject: 'Stripe flagged your account',
    html: wrap(borderColor('critical'), body),
  };
}

// ---------------------------------------------------------------------------
// Template C: VAMP Critical
// ---------------------------------------------------------------------------

export function vampCritical(data: VampCriticalData): EmailOutput {
  const ratioStr = pct(data.vampRatio);

  const body = `
    ${bigNumber(`${ratioStr}%`, COLORS.red)}
    <p style="margin:16px 0 8px 0;">Your combined fraud and dispute ratio exceeds the Visa VAMP 1.5% threshold.</p>
    <p style="margin:0 0 8px 0;">Breakdown: <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.fraudWarnings}</span> fraud warnings + <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.disputes}</span> disputes out of <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.totalCharges.toLocaleString()}</span> charges.</p>
    <p style="margin:0 0 16px 0;">Health score: <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.healthScore}</span>/100</p>
    <p style="margin:0 0 8px 0;font-weight:600;">Actions to take now:</p>
    <ol style="margin:0 0 0 0;padding-left:20px;">
      <li style="margin-bottom:4px;">Review all open disputes and submit evidence.</li>
      <li style="margin-bottom:4px;">Enable 3D Secure on high-risk transactions.</li>
      <li style="margin-bottom:4px;">Check Radar rules for fraud patterns.</li>
    </ol>
    ${button('Open Stripe Dashboard', 'https://dashboard.stripe.com')}`;

  return {
    subject: `VAMP ratio at ${ratioStr}%. Above 1.5% threshold.`,
    html: wrap(borderColor('critical'), body),
  };
}

// ---------------------------------------------------------------------------
// Template D: Decline Rate Warning
// ---------------------------------------------------------------------------

export function declineRateWarning(data: DeclineRateWarningData): EmailOutput {
  const rateStr = pct(data.declineRate);
  const isAboveThreshold = data.declineRate >= 0.20;
  const topColor = isAboveThreshold ? borderColor('critical') : borderColor('warning');
  const numberColor = isAboveThreshold ? COLORS.red : COLORS.amber;

  const body = `
    ${bigNumber(`${rateStr}%`, numberColor)}
    <p style="margin:16px 0 8px 0;">Your decline rate is <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${rateStr}%</span>. The Visa enumeration threshold is <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">20.00%</span>.</p>
    <p style="margin:0 0 8px 0;"><span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.declines.toLocaleString()}</span> declines out of <span style="font-family:'Courier New',Courier,monospace;font-weight:600;">${data.totalAttempts.toLocaleString()}</span> total attempts in the last 30 days.</p>
    <p style="margin:0 0 16px 0;">High decline rates often indicate card-testing bot activity.</p>
    <ol style="margin:0 0 0 0;padding-left:20px;">
      <li style="margin-bottom:4px;">Enable CAPTCHA on your checkout.</li>
      <li style="margin-bottom:4px;">Review Radar velocity rules.</li>
      <li style="margin-bottom:4px;">Check for unusual patterns in declined transactions.</li>
    </ol>
    ${button('Open Stripe Dashboard', 'https://dashboard.stripe.com')}`;

  return {
    subject: `Decline rate at ${rateStr}%`,
    html: wrap(topColor, body),
  };
}

// ---------------------------------------------------------------------------
// Template E: Daily Digest
// ---------------------------------------------------------------------------

function deltaArrow(delta: number): string {
  if (delta > 0) {
    // Ratio went up = bad
    return `<span style="color:${COLORS.red};font-family:'Courier New',Courier,monospace;font-size:13px;">&#9650; +${pct(delta)}%</span>`;
  }
  if (delta < 0) {
    // Ratio went down = good
    return `<span style="color:${COLORS.green};font-family:'Courier New',Courier,monospace;font-size:13px;">&#9660; ${pct(delta)}%</span>`;
  }
  return `<span style="color:${COLORS.gray};font-family:'Courier New',Courier,monospace;font-size:13px;">- 0.00%</span>`;
}

function metricCell(label: string, value: string, delta: string): string {
  return `
    <td width="33%" align="center" valign="top" style="padding:12px 8px;">
      <div style="font-size:12px;color:${COLORS.mutedText};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:700;color:${COLORS.darkText};">${value}</div>
      <div style="margin-top:4px;">${delta}</div>
    </td>`;
}

export function dailyDigest(data: DailyDigestData): EmailOutput {
  const hColor = healthColor(data.healthScore);
  const topColor = hColor;

  const alertLine =
    data.alertCount > 0
      ? `<span style="font-weight:600;">${data.alertCount}</span> alert${data.alertCount === 1 ? '' : 's'} in the last 24 hours.`
      : 'No alerts in the last 24 hours.';

  const actionLine =
    data.healthScore >= 70
      ? 'No action needed.'
      : 'Review your Stripe Dashboard for details.';

  const body = `
    ${bigNumber(`${data.healthScore}/100`, hColor)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;border:1px solid ${COLORS.lightGray};border-radius:6px;">
      <tr>
        ${metricCell('Dispute ratio', `${pct(data.disputeRatio)}%`, deltaArrow(data.disputeRatioDelta))}
        ${metricCell('Fraud ratio', `${pct(data.fraudRatio)}%`, deltaArrow(data.fraudRatioDelta))}
        ${metricCell('Decline rate', `${pct(data.declineRate)}%`, '')}
      </tr>
    </table>
    <p style="margin:16px 0 8px 0;">${alertLine}</p>
    <p style="margin:0 0 0 0;">${actionLine}</p>
    ${button('Open Stripe Dashboard', 'https://dashboard.stripe.com')}`;

  return {
    subject: `Daily report. Health: ${data.healthScore}/100`,
    html: wrap(topColor, body),
  };
}
