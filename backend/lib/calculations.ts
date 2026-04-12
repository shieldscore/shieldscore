/**
 * ShieldScore Calculation Engine
 *
 * All ratio and scoring calculations are deterministic.
 * No ML. No guessing. Exact threshold math.
 */

// 2026 Card Network Thresholds
export const THRESHOLDS = {
  VISA_VAMP: 0.015,           // 1.5% combined fraud + dispute ratio
  MASTERCARD_CMM: 0.01,       // 1.0% dispute ratio (warning tier)
  MASTERCARD_ECM: 0.015,      // 1.5% dispute ratio (penalty tier)
  MASTERCARD_MIN_DISPUTES: 100, // Minimum dispute count for CMM/ECM
  VISA_ENUMERATION: 0.20,     // 20% decline rate (card testing)
} as const;

// Alert trigger thresholds
export const ALERT_THRESHOLDS = {
  APPROACHING: 0.005,         // 0.5% — info alert
  WARNING: 0.0075,            // 0.75% — warning alert
  CMM_ZONE: 0.01,             // 1.0% — CMM zone alert
  PENALTY_ZONE: 0.015,        // 1.5% — ECM/VAMP zone alert
  DECLINE_WARNING: 0.15,      // 15% — decline rate warning
  DECLINE_CRITICAL: 0.20,     // 20% — enumeration threshold
} as const;

export interface MetricInputs {
  totalCharges: number;
  totalDisputes: number;
  totalFraudWarnings: number;
  totalDeclines: number;
  totalAttempts: number;
  hasRestrictions: boolean;
}

export interface CalculatedMetrics {
  vampRatio: number;
  mcDisputeRatio: number;
  declineRate: number;
  healthScore: number;
}

/**
 * VAMP Ratio (Visa Acquirer Monitoring Program)
 * Formula: (TC40 Fraud Reports + Disputes) / Total Settled Transactions
 * Threshold: 1.5%
 */
export function calculateVAMPRatio(
  fraudWarnings: number,
  disputes: number,
  totalCharges: number
): number {
  if (totalCharges === 0) return 0;
  return (fraudWarnings + disputes) / totalCharges;
}

/**
 * Mastercard Dispute Ratio
 * Used for both CMM (1.0%) and ECM (1.5%) thresholds
 * Note: CMM/ECM also require 100+ disputes to trigger
 */
export function calculateMCDisputeRatio(
  disputes: number,
  totalCharges: number
): number {
  if (totalCharges === 0) return 0;
  return disputes / totalCharges;
}

/**
 * Decline Rate (Visa Enumeration / Card Testing Detection)
 * Threshold: 20%
 */
export function calculateDeclineRate(
  declines: number,
  totalAttempts: number
): number {
  if (totalAttempts === 0) return 0;
  return declines / totalAttempts;
}

/**
 * Composite Health Score (0-100)
 *
 * Deterministic, threshold-based scoring.
 * Green = 70-100 (safe)
 * Yellow = 40-69 (caution)
 * Red = 0-39 (critical)
 */
export function calculateHealthScore(
  vampRatio: number,
  mcDisputeRatio: number,
  declineRate: number,
  hasRestrictions: boolean
): number {
  let score = 100;

  // VAMP impact (heaviest weight)
  if (vampRatio >= THRESHOLDS.VISA_VAMP) {
    score -= 50;
  } else if (vampRatio >= THRESHOLDS.MASTERCARD_CMM) {
    score -= 30;
  } else if (vampRatio >= 0.005) {
    score -= 10;
  }

  // Mastercard impact
  if (mcDisputeRatio >= THRESHOLDS.MASTERCARD_ECM) {
    score -= 30;
  } else if (mcDisputeRatio >= THRESHOLDS.MASTERCARD_CMM) {
    score -= 15;
  } else if (mcDisputeRatio >= 0.005) {
    score -= 5;
  }

  // Decline rate impact
  if (declineRate >= THRESHOLDS.VISA_ENUMERATION) {
    score -= 20;
  } else if (declineRate >= 0.10) {
    score -= 10;
  }

  // Restrictions impact
  if (hasRestrictions) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate all metrics from raw inputs
 */
export function calculateAllMetrics(inputs: MetricInputs): CalculatedMetrics {
  const vampRatio = calculateVAMPRatio(
    inputs.totalFraudWarnings,
    inputs.totalDisputes,
    inputs.totalCharges
  );
  const mcDisputeRatio = calculateMCDisputeRatio(
    inputs.totalDisputes,
    inputs.totalCharges
  );
  const declineRate = calculateDeclineRate(
    inputs.totalDeclines,
    inputs.totalAttempts
  );
  const healthScore = calculateHealthScore(
    vampRatio,
    mcDisputeRatio,
    declineRate,
    inputs.hasRestrictions
  );

  return { vampRatio, mcDisputeRatio, declineRate, healthScore };
}

/**
 * Get the health status color based on score
 */
export function getHealthStatus(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Determine which alerts should fire based on current ratios
 */
export function getTriggeredAlerts(
  vampRatio: number,
  mcDisputeRatio: number,
  declineRate: number,
  hasRestrictions: boolean
): Array<{
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}> {
  const alerts: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
  }> = [];

  // Dispute ratio alerts (use the higher of VAMP or MC ratio)
  const maxDisputeRatio = Math.max(vampRatio, mcDisputeRatio);

  if (maxDisputeRatio >= ALERT_THRESHOLDS.PENALTY_ZONE) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'critical',
      title: `Dispute ratio at ${(maxDisputeRatio * 100).toFixed(2)}% — ECM/VAMP penalty zone`,
      message: `Your dispute ratio has reached ${(maxDisputeRatio * 100).toFixed(2)}%, which is at or above the 1.5% threshold for Visa VAMP penalties and Mastercard ECM fines ($25,000-$100,000+/month). Immediate action required.`,
    });
  } else if (maxDisputeRatio >= ALERT_THRESHOLDS.CMM_ZONE) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'warning',
      title: `Dispute ratio at ${(maxDisputeRatio * 100).toFixed(2)}% — Mastercard CMM warning zone`,
      message: `Your dispute ratio has reached ${(maxDisputeRatio * 100).toFixed(2)}%, entering the Mastercard CMM monitoring zone (1.0%+). No financial penalties yet, but continued escalation will trigger ECM fines.`,
    });
  } else if (maxDisputeRatio >= ALERT_THRESHOLDS.WARNING) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'warning',
      title: `Dispute ratio approaching danger at ${(maxDisputeRatio * 100).toFixed(2)}%`,
      message: `Your dispute ratio is ${(maxDisputeRatio * 100).toFixed(2)}%, approaching the 1.0% Mastercard CMM threshold. Review recent disputes and consider preventive action.`,
    });
  } else if (maxDisputeRatio >= ALERT_THRESHOLDS.APPROACHING) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'info',
      title: `Dispute ratio elevated at ${(maxDisputeRatio * 100).toFixed(2)}%`,
      message: `Your dispute ratio is ${(maxDisputeRatio * 100).toFixed(2)}%. This is still below warning thresholds but worth monitoring.`,
    });
  }

  // Decline rate alerts
  if (declineRate >= ALERT_THRESHOLDS.DECLINE_CRITICAL) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'critical',
      title: `Decline rate at ${(declineRate * 100).toFixed(1)}% — card testing threshold`,
      message: `Your decline rate is ${(declineRate * 100).toFixed(1)}%, exceeding the 20% Visa enumeration threshold. This may indicate card testing bot activity.`,
    });
  } else if (declineRate >= ALERT_THRESHOLDS.DECLINE_WARNING) {
    alerts.push({
      type: 'threshold_warning',
      severity: 'warning',
      title: `Decline rate elevated at ${(declineRate * 100).toFixed(1)}%`,
      message: `Your decline rate is ${(declineRate * 100).toFixed(1)}%, approaching the 20% Visa enumeration threshold. Monitor for unusual transaction patterns.`,
    });
  }

  // Restriction alert
  if (hasRestrictions) {
    alerts.push({
      type: 'restriction_detected',
      severity: 'critical',
      title: 'Account restriction detected',
      message: 'Stripe has flagged your account with pending requirements or restricted capabilities. Check your Stripe Dashboard immediately.',
    });
  }

  return alerts;
}
