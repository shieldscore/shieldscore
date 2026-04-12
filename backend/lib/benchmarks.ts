/**
 * Industry Benchmarks by Merchant Category Code (MCC)
 *
 * Approximate average dispute ratios by industry vertical.
 * Used for contextualizing a merchant's performance vs peers.
 */

export type RiskLevel = 'low' | 'medium' | 'high';
export type BenchmarkPerformance = 'below_average' | 'average' | 'above_average';

export interface IndustryBenchmark {
  averageDisputeRatio: number;
  industryName: string;
  riskLevel: RiskLevel;
}

export interface BenchmarkComparison {
  industryName: string;
  averageDisputeRatio: number;
  merchantRatio: number;
  performance: BenchmarkPerformance;
}

interface BenchmarkEntry {
  industryName: string;
  averageDisputeRatio: number;
  riskLevel: RiskLevel;
  mccCodes: string[];
}

const BENCHMARKS: BenchmarkEntry[] = [
  {
    industryName: 'Digital Goods / Software',
    averageDisputeRatio: 0.008,
    riskLevel: 'medium',
    mccCodes: ['5817', '5818'],
  },
  {
    industryName: 'Subscription Services',
    averageDisputeRatio: 0.012,
    riskLevel: 'high',
    mccCodes: ['5968'],
  },
  {
    industryName: 'E-commerce General',
    averageDisputeRatio: 0.006,
    riskLevel: 'medium',
    mccCodes: ['5999'],
  },
  {
    industryName: 'Travel',
    averageDisputeRatio: 0.009,
    riskLevel: 'medium',
    mccCodes: [
      '4722',
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
    ],
  },
  {
    industryName: 'Food Delivery',
    averageDisputeRatio: 0.004,
    riskLevel: 'low',
    mccCodes: ['5812'],
  },
  {
    industryName: 'Health / Supplements',
    averageDisputeRatio: 0.015,
    riskLevel: 'high',
    mccCodes: ['5912'],
  },
  {
    industryName: 'Gaming / Digital Content',
    averageDisputeRatio: 0.018,
    riskLevel: 'high',
    mccCodes: ['7994'],
  },
];

const DEFAULT_BENCHMARK: IndustryBenchmark = {
  averageDisputeRatio: 0.007,
  industryName: 'General',
  riskLevel: 'medium',
};

// Build a fast lookup map: MCC -> benchmark entry
const MCC_LOOKUP = new Map<string, BenchmarkEntry>();
for (const entry of BENCHMARKS) {
  for (const code of entry.mccCodes) {
    MCC_LOOKUP.set(code, entry);
  }
}

/**
 * Get the industry benchmark for a given MCC code.
 * Falls back to "General" if the MCC is unknown.
 */
export function getIndustryBenchmark(mcc: string): IndustryBenchmark {
  const entry = MCC_LOOKUP.get(mcc);
  if (!entry) return DEFAULT_BENCHMARK;

  return {
    averageDisputeRatio: entry.averageDisputeRatio,
    industryName: entry.industryName,
    riskLevel: entry.riskLevel,
  };
}

/**
 * Compare a merchant's dispute ratio against their industry benchmark.
 *
 * Performance labels:
 * - 'below_average' = merchant is BELOW industry avg (good)
 * - 'average' = within 20% of industry avg
 * - 'above_average' = merchant is ABOVE industry avg (bad)
 */
export function getBenchmarkComparison(
  mcc: string,
  merchantDisputeRatio: number
): BenchmarkComparison {
  const bench = getIndustryBenchmark(mcc);
  const ratio = merchantDisputeRatio;
  const avg = bench.averageDisputeRatio;

  let performance: BenchmarkPerformance;
  if (ratio <= avg * 0.8) {
    performance = 'below_average';
  } else if (ratio >= avg * 1.2) {
    performance = 'above_average';
  } else {
    performance = 'average';
  }

  return {
    industryName: bench.industryName,
    averageDisputeRatio: avg,
    merchantRatio: ratio,
    performance,
  };
}
