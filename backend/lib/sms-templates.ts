/**
 * SMS message templates.
 * Keep messages under 160 characters per segment. Direct and urgent.
 */

export function thresholdSMS(ratio: number, threshold: string): string {
  return `ShieldScore: Your dispute ratio is ${(ratio * 100).toFixed(2)}%. ${threshold} threshold approaching. Check your Stripe Dashboard.`;
}

export function restrictionSMS(): string {
  return `ShieldScore: Stripe flagged your account with new requirements. Check Settings > Account details immediately.`;
}

export function vampCriticalSMS(ratio: number): string {
  return `ShieldScore: VAMP ratio at ${(ratio * 100).toFixed(2)}%. Above 1.5% threshold. Penalties may apply. Check Stripe now.`;
}

export function declineRateSMS(rate: number): string {
  return `ShieldScore: Decline rate at ${(rate * 100).toFixed(1)}%. Possible card testing. Review Radar rules.`;
}

export function velocitySpikeSMS(currentDeclines: number, avgDeclines: number): string {
  return `ShieldScore: Unusual decline pattern detected. ${currentDeclines} declines today vs ${Math.round(avgDeclines)} daily average. Check your dashboard.`;
}
