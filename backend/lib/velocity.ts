/**
 * Velocity & Card-Testing Anomaly Detection
 *
 * Uses Z-score analysis to detect unusual transaction patterns.
 * Z-score measures how many standard deviations a value is from the mean.
 * This prevents false positives during natural volume spikes (Black Friday, etc.).
 */

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ZScoreResult {
  mean: number;
  stddev: number;
  zScore: number;
}

interface VelocityMetric {
  mean: number;
  stddev: number;
  current: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface AnomalyReport {
  chargeVelocity: VelocityMetric;
  declineVelocity: VelocityMetric;
  declineRate: {
    current: number;
    isAboveEnumeration: boolean;
  };
  overallStatus: 'normal' | 'elevated' | 'critical';
  summary: string;
}

// ---------------------------------------------------------------------------
// Z-score thresholds
// ---------------------------------------------------------------------------

const Z_ELEVATED = 2.0; // ~2.5% chance of being normal
const Z_CRITICAL = 3.0; // ~0.1% chance of being normal
const FALLBACK_MULTIPLIER = 3; // When stddev is 0, flag if current > 3x mean
const ENUMERATION_THRESHOLD = 0.20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate Z-score for a value given historical data.
 * Z = (current - mean) / stddev
 */
export function calculateZScore(values: number[], current: number): ZScoreResult {
  if (values.length === 0) {
    return { mean: 0, stddev: 0, zScore: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(variance);

  // If no variance, Z-score is undefined — return 0
  // The caller uses the fallback multiplier check instead
  if (stddev === 0) {
    return { mean, stddev: 0, zScore: 0 };
  }

  const zScore = (current - mean) / stddev;
  return { mean, stddev, zScore };
}

/**
 * Determine if a metric is anomalous given its Z-score result and current value.
 */
function isAnomalous(z: ZScoreResult, current: number): boolean {
  if (z.stddev === 0) {
    // Fallback: flag if current > 3x the mean (and mean is not 0)
    return z.mean > 0 && current > z.mean * FALLBACK_MULTIPLIER;
  }
  return z.zScore > Z_ELEVATED;
}

function getMetricStatus(z: ZScoreResult, current: number): 'normal' | 'elevated' | 'critical' {
  if (z.stddev === 0) {
    if (z.mean > 0 && current > z.mean * FALLBACK_MULTIPLIER) return 'critical';
    return 'normal';
  }
  if (z.zScore > Z_CRITICAL) return 'critical';
  if (z.zScore > Z_ELEVATED) return 'elevated';
  return 'normal';
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Detect velocity anomalies for a merchant using Z-score analysis.
 * Compares today's metrics against the 30-day historical baseline.
 */
export async function detectAnomalies(merchantId: string): Promise<AnomalyReport> {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Get historical daily metrics (excluding today for baseline)
  const { data: history } = await supabase
    .from('daily_metrics')
    .select('date, total_charges, total_declines, decline_rate')
    .eq('merchant_id', merchantId)
    .gte('date', thirtyDaysAgo)
    .lt('date', today)
    .order('date', { ascending: true });

  // Get today's metrics
  const { data: todayMetrics } = await supabase
    .from('daily_metrics')
    .select('total_charges, total_declines, decline_rate')
    .eq('merchant_id', merchantId)
    .eq('date', today)
    .single();

  const historicalCharges = (history ?? []).map((r) => Number(r.total_charges));
  const historicalDeclines = (history ?? []).map((r) => Number(r.total_declines));

  const currentCharges = Number(todayMetrics?.total_charges ?? 0);
  const currentDeclines = Number(todayMetrics?.total_declines ?? 0);
  const currentDeclineRate = Number(todayMetrics?.decline_rate ?? 0);

  // Calculate Z-scores
  const chargeZ = calculateZScore(historicalCharges, currentCharges);
  const declineZ = calculateZScore(historicalDeclines, currentDeclines);

  const chargeVelocity: VelocityMetric = {
    mean: chargeZ.mean,
    stddev: chargeZ.stddev,
    current: currentCharges,
    zScore: chargeZ.zScore,
    isAnomaly: isAnomalous(chargeZ, currentCharges),
  };

  const declineVelocity: VelocityMetric = {
    mean: declineZ.mean,
    stddev: declineZ.stddev,
    current: currentDeclines,
    zScore: declineZ.zScore,
    isAnomaly: isAnomalous(declineZ, currentDeclines),
  };

  const declineRate = {
    current: currentDeclineRate,
    isAboveEnumeration: currentDeclineRate >= ENUMERATION_THRESHOLD,
  };

  // Determine overall status
  const chargeStatus = getMetricStatus(chargeZ, currentCharges);
  const declineStatus = getMetricStatus(declineZ, currentDeclines);

  let overallStatus: 'normal' | 'elevated' | 'critical' = 'normal';
  if (chargeStatus === 'critical' || declineStatus === 'critical' || declineRate.isAboveEnumeration) {
    overallStatus = 'critical';
  } else if (chargeStatus === 'elevated' || declineStatus === 'elevated') {
    overallStatus = 'elevated';
  }

  // Build summary
  const summaryParts: string[] = [];
  if (declineVelocity.isAnomaly) {
    if (declineZ.stddev > 0) {
      summaryParts.push(
        `Decline count today (${currentDeclines}) is ${declineZ.zScore.toFixed(1)} standard deviations above your 30-day average (${declineZ.mean.toFixed(0)}).`
      );
    } else {
      summaryParts.push(
        `Decline count today (${currentDeclines}) is ${(currentDeclines / (declineZ.mean || 1)).toFixed(1)}x your daily average (${declineZ.mean.toFixed(0)}).`
      );
    }
  }
  if (chargeVelocity.isAnomaly) {
    if (chargeZ.stddev > 0) {
      summaryParts.push(
        `Charge volume today (${currentCharges}) is ${chargeZ.zScore.toFixed(1)} standard deviations above your 30-day average (${chargeZ.mean.toFixed(0)}).`
      );
    } else {
      summaryParts.push(
        `Charge volume today (${currentCharges}) is ${(currentCharges / (chargeZ.mean || 1)).toFixed(1)}x your daily average (${chargeZ.mean.toFixed(0)}).`
      );
    }
  }
  if (declineRate.isAboveEnumeration) {
    summaryParts.push(`Decline rate at ${(currentDeclineRate * 100).toFixed(1)}% exceeds the 20% Visa enumeration threshold.`);
  }

  const summary =
    summaryParts.length > 0
      ? summaryParts.join(' ')
      : 'All transaction patterns are within normal ranges.';

  return {
    chargeVelocity,
    declineVelocity,
    declineRate,
    overallStatus,
    summary,
  };
}
