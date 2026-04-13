/**
 * Week-over-Week Comparison
 *
 * Compares average RATIOS (not absolute counts) between the current week
 * and the previous week. Absolute counts are misleading when volume changes.
 */

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeekStats {
  avgDisputeRatio: number;
  avgFraudRatio: number;
  avgDeclineRate: number;
  avgHealthScore: number;
  totalDisputes: number;
  totalCharges: number;
}

interface MetricChange {
  delta: number;
  direction: 'up' | 'down' | 'flat';
}

export interface WeeklyComparison {
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  changes: {
    disputeRatio: MetricChange;
    fraudRatio: MetricChange;
    declineRate: MetricChange;
    healthScore: MetricChange;
  };
  summary: string;
  hasEnoughData: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds for "flat"
// ---------------------------------------------------------------------------

const RATIO_FLAT_THRESHOLD = 0.0001; // 0.01%
const SCORE_FLAT_THRESHOLD = 2; // 2 points

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function direction(delta: number, flatThreshold: number): 'up' | 'down' | 'flat' {
  if (Math.abs(delta) < flatThreshold) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function pct(value: number): string {
  return (value * 100).toFixed(2);
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function getWeeklyComparison(merchantId: string): Promise<WeeklyComparison> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: rows } = await supabase
    .from('daily_metrics')
    .select('date, dispute_ratio, fraud_ratio, decline_rate, health_score, total_disputes, total_charges')
    .eq('merchant_id', merchantId)
    .gte('date', fourteenDaysAgo)
    .order('date', { ascending: true });

  const allRows = rows ?? [];

  const thisWeekRows = allRows.filter((r) => String(r.date) >= sevenDaysAgo);
  const lastWeekRows = allRows.filter((r) => String(r.date) < sevenDaysAgo);

  const hasEnoughData = thisWeekRows.length >= 2 && lastWeekRows.length >= 2;

  const thisWeek: WeekStats = {
    avgDisputeRatio: avg(thisWeekRows.map((r) => Number(r.dispute_ratio))),
    avgFraudRatio: avg(thisWeekRows.map((r) => Number(r.fraud_ratio))),
    avgDeclineRate: avg(thisWeekRows.map((r) => Number(r.decline_rate))),
    avgHealthScore: Math.round(avg(thisWeekRows.map((r) => Number(r.health_score)))),
    totalDisputes: thisWeekRows.reduce((s, r) => s + Number(r.total_disputes), 0),
    totalCharges: thisWeekRows.reduce((s, r) => s + Number(r.total_charges), 0),
  };

  const lastWeek: WeekStats = {
    avgDisputeRatio: avg(lastWeekRows.map((r) => Number(r.dispute_ratio))),
    avgFraudRatio: avg(lastWeekRows.map((r) => Number(r.fraud_ratio))),
    avgDeclineRate: avg(lastWeekRows.map((r) => Number(r.decline_rate))),
    avgHealthScore: Math.round(avg(lastWeekRows.map((r) => Number(r.health_score)))),
    totalDisputes: lastWeekRows.reduce((s, r) => s + Number(r.total_disputes), 0),
    totalCharges: lastWeekRows.reduce((s, r) => s + Number(r.total_charges), 0),
  };

  const drDelta = thisWeek.avgDisputeRatio - lastWeek.avgDisputeRatio;
  const frDelta = thisWeek.avgFraudRatio - lastWeek.avgFraudRatio;
  const dcDelta = thisWeek.avgDeclineRate - lastWeek.avgDeclineRate;
  const hsDelta = thisWeek.avgHealthScore - lastWeek.avgHealthScore;

  const changes = {
    disputeRatio: { delta: drDelta, direction: direction(drDelta, RATIO_FLAT_THRESHOLD) },
    fraudRatio: { delta: frDelta, direction: direction(frDelta, RATIO_FLAT_THRESHOLD) },
    declineRate: { delta: dcDelta, direction: direction(dcDelta, RATIO_FLAT_THRESHOLD) },
    healthScore: { delta: hsDelta, direction: direction(hsDelta, SCORE_FLAT_THRESHOLD) },
  };

  // Build summary focusing on ratios
  const summaryParts: string[] = [];

  if (changes.disputeRatio.direction !== 'flat') {
    const verb = changes.disputeRatio.direction === 'up' ? 'increased' : 'decreased';
    summaryParts.push(
      `Dispute ratio ${verb} ${pct(Math.abs(drDelta))}% from last week (${pct(lastWeek.avgDisputeRatio)}% to ${pct(thisWeek.avgDisputeRatio)}%).`
    );
  }

  if (changes.healthScore.direction !== 'flat') {
    const verb = changes.healthScore.direction === 'up' ? 'improved' : 'dropped';
    summaryParts.push(`Health score ${verb} ${Math.abs(hsDelta)} points.`);
  }

  if (changes.fraudRatio.direction !== 'flat') {
    const verb = changes.fraudRatio.direction === 'up' ? 'increased' : 'decreased';
    summaryParts.push(`Fraud ratio ${verb} ${pct(Math.abs(frDelta))}%.`);
  }

  const summary =
    summaryParts.length > 0
      ? summaryParts.join(' ')
      : 'All metrics are stable compared to last week.';

  return {
    thisWeek,
    lastWeek,
    changes,
    summary,
    hasEnoughData,
  };
}
