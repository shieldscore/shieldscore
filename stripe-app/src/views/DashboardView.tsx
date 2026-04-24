import {
  ContextView,
  Box,
  Inline,
  Badge,
  Banner,
  Button,
  Divider,
  Icon,
  Spinner,
  Sparkline,
  LineChart,
  Accordion,
  AccordionItem,
  Link,
  FocusView,
  Select,
} from '@stripe/ui-extension-sdk/ui';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { useState, useEffect, useCallback, useRef } from 'react';
import BrandIcon from './brand_icon.svg';

interface TrendData {
  direction: 'up' | 'down' | 'flat';
  delta: number;
  periodDays: number;
}

interface Projections {
  daysUntilCMM: number | null;
  daysUntilVAMP: number | null;
  daysUntilEnumeration: number | null;
}

interface Benchmark {
  industryName: string;
  averageDisputeRatio: number;
  merchantRatio: number;
  performance: 'below_average' | 'average' | 'above_average';
}

interface SparklinePoint {
  date: string;
  disputeRatio: number;
  fraudRatio: number;
  declineRate: number;
  healthScore: number;
}

interface HistoryData {
  dates: string[];
  disputeRatios: number[];
  fraudRatios: number[];
  declineRates: number[];
  healthScores: number[];
}

interface MetricChange {
  delta: number;
  direction: 'up' | 'down' | 'flat';
}

interface WeekStats {
  avgDisputeRatio: number;
  avgFraudRatio: number;
  avgDeclineRate: number;
  avgHealthScore: number;
  totalDisputes: number;
  totalCharges: number;
}

interface WeeklyComparisonData {
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

interface VelocityMetric {
  mean: number;
  stddev: number;
  current: number;
  zScore: number;
  isAnomaly: boolean;
}

interface VelocityReport {
  chargeVelocity: VelocityMetric;
  declineVelocity: VelocityMetric;
  declineRate: {
    current: number;
    isAboveEnumeration: boolean;
  };
  overallStatus: 'normal' | 'elevated' | 'critical';
  summary: string;
}

interface RemediationSummary {
  severity: 'none' | 'advisory' | 'urgent' | 'critical';
  actionCount: number;
  topAction: string | null;
}

interface RemediationAction {
  priority: 1 | 2 | 3;
  category: string;
  title: string;
  description: string;
  stripeLink: string | null;
}

interface RemediationPlan {
  severity: 'none' | 'advisory' | 'urgent' | 'critical';
  title: string;
  summary: string;
  actions: RemediationAction[];
  generatedAt: string;
}

interface MetricsResponse {
  healthScore: number;
  healthStatus: 'green' | 'yellow' | 'red';
  disputeRatio: { current: number; trend: TrendData };
  fraudRatio: { current: number; trend: TrendData };
  declineRate: { current: number; trend: TrendData };
  totalCharges: number;
  totalDisputes: number;
  totalFraudWarnings: number;
  activeRestrictions: number;
  projections: Projections;
  benchmark: Benchmark;
  sparkline: SparklinePoint[];
  history: HistoryData;
  weeklyComparison: WeeklyComparisonData;
  remediation?: RemediationSummary;
  lastUpdated: string;
  initializing?: boolean;
}

const EVIDENCE_LABELS: Record<string, string> = {
  customer_purchase_ip: 'Customer IP address',
  customer_signature: 'Customer signature',
  shipping_tracking_number: 'Tracking number',
  shipping_carrier: 'Shipping carrier',
  shipping_date: 'Ship date',
  shipping_address: 'Shipping address',
  duplicate_charge_id: 'Original charge ID',
  duplicate_charge_explanation: 'Explanation of charges',
  duplicate_charge_documentation: 'Supporting docs',
  cancellation_policy: 'Cancellation policy',
  cancellation_rebuttal: 'Cancellation rebuttal',
  customer_communication: 'Customer emails/messages',
  product_description: 'Product description',
  refund_policy: 'Refund policy',
  refund_refusal_explanation: 'Refund refusal reason',
  billing_address: 'Billing address',
  receipt: 'Transaction receipt',
  service_documentation: 'Service documentation',
  uncategorized_text: 'Additional evidence',
};

interface DisputeItem {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  created: number;
  respondBy: number | null;
  ratioImpact: number;
  guidance: {
    advice: string;
    winRate: string;
    priority: 'high' | 'medium' | 'low';
    evidenceFields: string[];
  };
}

const BACKEND_URL = 'https://shieldscore.io/api';

// TODO: Move to Stripe Secret Store API for production.
// Hardcoded to match backend API_SECRET_KEY. The Stripe App CSP restricts
// which domains can be contacted, so this key adds defense-in-depth.
const API_SECRET_KEY = '066e61cc978c97d28afc6975ebcc5d70d89fc358e6f1624d9047a8755a6d18ce';

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(API_SECRET_KEY ? { Authorization: `Bearer ${API_SECRET_KEY}` } : {}),
    ...extra,
  };
}

const DashboardView = ({ userContext, environment }: ExtensionContextValue) => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'network' | 'api' | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [velocity, setVelocity] = useState<VelocityReport | null>(null);
  const [historyDays, setHistoryDays] = useState<'30' | '90'>('30');
  const [remediationPlan, setRemediationPlan] = useState<RemediationPlan | null>(null);
  const [showRemediation, setShowRemediation] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAccountId = useCallback(() => {
    return environment?.objectContext?.id || userContext?.account?.id;
  }, [environment, userContext]);

  const getMode = useCallback((): 'test' | 'live' => {
    return environment?.mode === 'test' ? 'test' : 'live';
  }, [environment]);

  const fetchMetrics = useCallback(async (opts?: { refresh?: boolean }) => {
    try {
      setLoading(true);
      const accountId = getAccountId();
      if (!accountId) {
        setErrorKind('api');
        setError('Could not determine Stripe account ID');
        return;
      }

      const mode = getMode();
      const refreshParam = opts?.refresh ? '&refresh=1' : '';
      let response: Response;
      try {
        response = await fetch(
          `${BACKEND_URL}/metrics/${accountId}?historyDays=${historyDays}&mode=${mode}${refreshParam}`,
          { headers: authHeaders() }
        );
      } catch (netErr) {
        setErrorKind('network');
        setError(netErr instanceof Error ? netErr.message : String(netErr));
        return;
      }

      if (!response.ok) {
        setErrorKind('api');
        setError(`Backend returned ${response.status}`);
        return;
      }

      const data: MetricsResponse = await response.json();
      setMetrics(data);
      setLastChecked(new Date());
      setError(null);
      setErrorKind(null);

      // Skip secondary fetches while the merchant is still being initialized —
      // they'd just return empty/404 and add noise.
      if (!data.initializing) {
        const [disputeRes, velocityRes] = await Promise.all([
          fetch(`${BACKEND_URL}/disputes/${accountId}?limit=5&mode=${mode}`, {
            headers: authHeaders(),
          }).catch(() => null),
          fetch(`${BACKEND_URL}/velocity/${accountId}?mode=${mode}`, {
            headers: authHeaders(),
          }).catch(() => null),
        ]);

        if (disputeRes?.ok) {
          const disputeData = await disputeRes.json();
          setDisputes(disputeData.disputes || []);
        }

        if (velocityRes?.ok) {
          const velocityData: VelocityReport = await velocityRes.json();
          setVelocity(velocityData);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorKind('network');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getAccountId, getMode, historyDays]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Poll while the backend reports initializing. Initial sync usually takes
  // 10–30s; we refetch every 5s until data lands, then stop.
  useEffect(() => {
    if (metrics?.initializing) {
      pollTimerRef.current = setTimeout(() => {
        fetchMetrics();
      }, 5000);
    }
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [metrics?.initializing, fetchMetrics]);

  const fetchRemediationPlan = useCallback(async () => {
    const accountId = getAccountId();
    if (!accountId) return;
    const mode = getMode();
    try {
      const res = await fetch(`${BACKEND_URL}/remediation/${accountId}?mode=${mode}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const plan: RemediationPlan = await res.json();
        setRemediationPlan(plan);
        setShowRemediation(true);
      }
    } catch {
      // Non-critical
    }
  }, [getAccountId, getMode]);

  const fmt = (ratio: number): string => `${(ratio * 100).toFixed(2)}%`;

  /** Sample every Nth data point so chart x-axis labels don't overlap */
  const sampleHistory = (dates: string[], values: number[]) => {
    const step = dates.length <= 7 ? 1 : dates.length <= 30 ? 5 : 10;
    const sampled: Array<{ date: string; value: number }> = [];
    for (let i = 0; i < dates.length; i += step) {
      const d = new Date(dates[i] + 'T00:00:00');
      sampled.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: values[i] });
    }
    const last = dates.length - 1;
    if (last % step !== 0) {
      const d = new Date(dates[last] + 'T00:00:00');
      sampled.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: values[last] });
    }
    return sampled;
  };

  const scoreBadge = (status: string) => {
    if (status === 'green') return <Badge type="positive">Healthy</Badge>;
    if (status === 'yellow') return <Badge type="warning">Caution</Badge>;
    return <Badge type="negative">Critical</Badge>;
  };

  const ratioBadge = (ratio: number, threshold: number) => {
    if (ratio >= threshold) return <Badge type="negative">Critical</Badge>;
    if (ratio >= threshold * 0.67) return <Badge type="warning">Warning</Badge>;
    return <Badge type="positive">Safe</Badge>;
  };

  const trendColor = (dir: string): 'success' | 'critical' | 'secondary' => {
    if (dir === 'up') return 'critical';
    if (dir === 'down') return 'success';
    return 'secondary';
  };

  const trendArrow = (dir: string): string => {
    if (dir === 'up') return '\u2191';
    if (dir === 'down') return '\u2193';
    return '\u2192';
  };

  const hasSparkline = metrics?.sparkline && metrics.sparkline.length > 1;

  // ── Loading ──────────────────────────────────
  if (loading && !metrics) {
    return (
      <ContextView title="ShieldScore" brandIcon={BrandIcon}>
        <Box css={{ padding: 'xlarge', stack: 'y', alignX: 'center', gap: 'medium' }}>
          <Spinner size="large" />
          <Inline css={{ font: 'body', color: 'secondary' }}>
            Loading health data...
          </Inline>
        </Box>
      </ContextView>
    );
  }

  // ── Initializing (first install) ─────────────
  if (metrics?.initializing) {
    return (
      <ContextView title="ShieldScore" brandIcon={BrandIcon}>
        <Box css={{ padding: 'xlarge', stack: 'y', alignX: 'center', gap: 'medium' }}>
          <Spinner size="large" />
          <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
            Loading initial data...
          </Inline>
          <Inline css={{ font: 'body', color: 'secondary' }}>
            Pulling 30 days of disputes, charges, and fraud warnings from Stripe.
            This usually takes under a minute.
          </Inline>
        </Box>
      </ContextView>
    );
  }

  // ── Error with no prior data ──────────────────
  if (!metrics && (error || !loading)) {
    const isNetwork = errorKind === 'network';
    return (
      <ContextView title="ShieldScore" brandIcon={BrandIcon}>
        <Box css={{ padding: 'medium', stack: 'y', gap: 'medium' }}>
          <Banner
            type={isNetwork ? 'critical' : 'caution'}
            title={isNetwork ? 'Connection error' : 'Setting up your account...'}
            description={
              isNetwork
                ? error || 'Failed to reach the ShieldScore backend.'
                : 'We are getting your account ready. This usually takes under a minute.'
            }
          />
          <Button type="primary" onPress={() => fetchMetrics({ refresh: true })}>
            Retry
          </Button>
        </Box>
      </ContextView>
    );
  }

  // ── No data yet (shouldn't normally reach here) ──
  if (!metrics) {
    return (
      <ContextView title="ShieldScore" brandIcon={BrandIcon}>
        <Box css={{ padding: 'xlarge', stack: 'y', alignX: 'center', gap: 'medium' }}>
          <Spinner size="large" />
          <Inline css={{ font: 'body', color: 'secondary' }}>
            Loading health data...
          </Inline>
        </Box>
      </ContextView>
    );
  }

  const hasProjections =
    metrics.projections.daysUntilCMM !== null ||
    metrics.projections.daysUntilVAMP !== null ||
    metrics.projections.daysUntilEnumeration !== null;

  return (
    <ContextView
      title="Account Health"
      brandIcon={BrandIcon}
      brandColor="#1a1a2e"
      banner={
        !bannerDismissed && metrics.activeRestrictions > 0 ? (
          <Banner
            type="critical"
            title="Account restriction detected"
            description="Stripe has flagged your account. Check Settings > Account details."
            onDismiss={() => setBannerDismissed(true)}
          />
        ) : !bannerDismissed && metrics.healthStatus === 'red' ? (
          <Banner
            type="critical"
            title="Health score critical"
            description={`Score: ${metrics.healthScore}/100. Immediate action needed.`}
            onDismiss={() => setBannerDismissed(true)}
          />
        ) : undefined
      }
    >
      {/* ── STALE DATA WARNING ─────────────────── */}
      {error && (
        <Box css={{ padding: 'small' }}>
          <Banner
            type="caution"
            title={errorKind === 'network' ? 'Connection error' : 'Data may be stale'}
            description={
              errorKind === 'network'
                ? 'Could not reach ShieldScore. Showing last known data.'
                : 'Could not refresh. Showing last known data.'
            }
            actions={
              <Button onPress={() => fetchMetrics({ refresh: true })} type="secondary" size="small">
                Retry
              </Button>
            }
          />
        </Box>
      )}

      {/* ── HEALTH SCORE ─────────────────────── */}
      <Box css={{ padding: 'medium' }}>
        <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}>
          <Box css={{ stack: 'x', gap: 'small', alignY: 'center' }}>
            <Icon name="shieldCheck" size="xlarge" css={{ fill: metrics.healthStatus === 'green' ? 'success' : metrics.healthStatus === 'yellow' ? 'attention' : 'critical' }} />
            <Box css={{ stack: 'y' }}>
              <Inline css={{ font: 'title', fontWeight: 'bold' }}>
                {metrics.healthScore}
              </Inline>
              {scoreBadge(metrics.healthStatus)}
            </Box>
          </Box>
          <Box css={{ stack: 'y', alignX: 'end', gap: 'xxsmall' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>
              {lastChecked.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </Inline>
            <Box css={{ alignX: 'end' }}>
              <Button type="secondary" size="small" onPress={() => fetchMetrics({ refresh: true })}>
                <Icon name="refresh" size="xsmall" />
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>
        <Inline css={{ font: 'caption', color: 'secondary', marginTop: 'xxsmall' }}>
          Account Health Score
        </Inline>
      </Box>

      <Divider />

      {/* ── TREND CHARTS ────────────────────── */}
      {metrics.history.dates.length > 1 && (
        <>
          <Box css={{ padding: 'medium' }}>
            <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center', marginBottom: 'small' }}>
              <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                <Icon name="growth" size="small" />
                <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
                  {historyDays === '30' ? '30' : '90'}-Day Trends
                </Inline>
              </Box>
              <Select
                value={historyDays}
                onChange={(e) => setHistoryDays(e.target.value as '30' | '90')}
                size="small"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </Select>
            </Box>

            <Inline css={{ font: 'caption', fontWeight: 'semibold', marginBottom: 'xsmall' }}>
              Dispute Ratio
            </Inline>
            <LineChart
              data={sampleHistory(metrics.history.dates, metrics.history.disputeRatios.map((r) => r * 100)).flatMap((pt) => [
                { date: pt.date, value: pt.value, series: 'Dispute %' },
                { date: pt.date, value: 1.0, series: 'CMM (1.0%)' },
                { date: pt.date, value: 1.5, series: 'VAMP (1.5%)' },
              ])}
              x="date"
              y="value"
              color="series"
              axis="both"
              grid="y"
              legend
              tooltip
            />

            <Box css={{ marginTop: 'medium' }}>
              <Inline css={{ font: 'caption', fontWeight: 'semibold', marginBottom: 'xsmall' }}>
                Health Score
              </Inline>
              <LineChart
                data={sampleHistory(metrics.history.dates, metrics.history.healthScores).map((pt) => ({
                  date: pt.date,
                  score: pt.value,
                }))}
                x="date"
                y="score"
                axis="both"
                grid="y"
                tooltip
              />
            </Box>

            <Box css={{ marginTop: 'small', alignX: 'end' }}>
              <Link
                href={`${BACKEND_URL}/export/${getAccountId()}?days=${historyDays}&mode=${getMode()}&token=${API_SECRET_KEY}`}
                target="_blank"
                external
                type="secondary"
              >
                Export CSV
              </Link>
            </Box>
          </Box>

          <Divider />
        </>
      )}

      {/* ── COMPLIANCE THRESHOLDS ─────────────── */}
      <Box css={{ paddingX: 'medium', paddingTop: 'medium' }}>
        <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
          <Icon name="compliance" size="small" />
          <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
            Compliance Thresholds
          </Inline>
        </Box>

        <Accordion>
          {/* Dispute Ratio */}
          <AccordionItem
            title="Dispute Ratio"
            actions={ratioBadge(metrics.disputeRatio.current, 0.015)}
            defaultOpen
          >
            <Box css={{ stack: 'y', gap: 'xsmall' }}>
              <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'baseline' }}>
                <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
                  {fmt(metrics.disputeRatio.current)}
                </Inline>
                <Inline css={{ font: 'caption', color: trendColor(metrics.disputeRatio.trend.direction) }}>
                  {trendArrow(metrics.disputeRatio.trend.direction)} {fmt(metrics.disputeRatio.trend.delta)} / {metrics.disputeRatio.trend.periodDays}d
                </Inline>
              </Box>
              {hasSparkline && (
                <Sparkline
                  data={metrics.sparkline}
                  x="date"
                  y="disputeRatio"
                />
              )}
              <Box css={{ stack: 'x', distribute: 'space-between' }}>
                <Inline css={{ font: 'caption', color: 'secondary' }}>CMM: 1.00%</Inline>
                <Inline css={{ font: 'caption', color: 'secondary' }}>VAMP: 1.50%</Inline>
              </Box>
            </Box>
          </AccordionItem>

          {/* Fraud Ratio */}
          <AccordionItem
            title="Fraud Ratio (VAMP)"
            actions={ratioBadge(metrics.fraudRatio.current, 0.015)}
          >
            <Box css={{ stack: 'y', gap: 'xsmall' }}>
              <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'baseline' }}>
                <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
                  {fmt(metrics.fraudRatio.current)}
                </Inline>
                <Inline css={{ font: 'caption', color: trendColor(metrics.fraudRatio.trend.direction) }}>
                  {trendArrow(metrics.fraudRatio.trend.direction)} {fmt(metrics.fraudRatio.trend.delta)} / {metrics.fraudRatio.trend.periodDays}d
                </Inline>
              </Box>
              {hasSparkline && (
                <Sparkline
                  data={metrics.sparkline}
                  x="date"
                  y="fraudRatio"
                />
              )}
              <Inline css={{ font: 'caption', color: 'secondary' }}>
                Combined VAMP threshold: 1.50%
              </Inline>
            </Box>
          </AccordionItem>

          {/* Decline Rate */}
          <AccordionItem
            title="Decline Rate"
            actions={ratioBadge(metrics.declineRate.current, 0.20)}
          >
            <Box css={{ stack: 'y', gap: 'xsmall' }}>
              <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'baseline' }}>
                <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
                  {fmt(metrics.declineRate.current)}
                </Inline>
                <Inline css={{ font: 'caption', color: trendColor(metrics.declineRate.trend.direction) }}>
                  {trendArrow(metrics.declineRate.trend.direction)} {fmt(metrics.declineRate.trend.delta)} / {metrics.declineRate.trend.periodDays}d
                </Inline>
              </Box>
              {hasSparkline && (
                <Sparkline
                  data={metrics.sparkline}
                  x="date"
                  y="declineRate"
                />
              )}
              <Inline css={{ font: 'caption', color: 'secondary' }}>
                Enumeration threshold: 20.00%
              </Inline>
            </Box>
          </AccordionItem>
        </Accordion>
      </Box>

      {/* ── REMEDIATION PLAN ─────────────────── */}
      {metrics.remediation && metrics.remediation.severity !== 'none' && (
        <>
          <Divider />
          <Box css={{ padding: 'medium' }}>
            {metrics.remediation.severity === 'critical' ? (
              <Banner
                type="critical"
                title="Immediate action required"
                description={`${metrics.remediation.actionCount} corrective actions identified. Top priority: ${metrics.remediation.topAction}.`}
                actions={
                  <Button type="destructive" onPress={fetchRemediationPlan}>
                    View plan
                  </Button>
                }
              />
            ) : metrics.remediation.severity === 'urgent' ? (
              <Box css={{ stack: 'y', gap: 'small' }}>
                <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                  <Icon name="warning" size="small" />
                  <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
                    Action Required
                  </Inline>
                  <Badge type="warning">{metrics.remediation.actionCount} actions</Badge>
                </Box>
                {metrics.remediation.topAction && (
                  <Inline css={{ font: 'caption' }}>
                    Top priority: {metrics.remediation.topAction}
                  </Inline>
                )}
                <Button type="secondary" size="small" onPress={fetchRemediationPlan}>
                  View full plan
                </Button>
              </Box>
            ) : (
              <Box css={{ stack: 'y', gap: 'xsmall' }}>
                <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                  <Icon name="info" size="small" />
                  <Inline css={{ font: 'body' }}>
                    {metrics.remediation.topAction}
                  </Inline>
                </Box>
                <Button type="secondary" size="small" onPress={fetchRemediationPlan}>
                  View recommendations
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ── REMEDIATION FOCUS VIEW ────────────── */}
      {remediationPlan && (
        <FocusView
          title="Remediation Plan"
          shown={showRemediation}
          setShown={setShowRemediation}
        >
          <Box css={{ padding: 'medium', stack: 'y', gap: 'medium' }}>
            <Banner
              type={remediationPlan.severity === 'critical' ? 'critical' : remediationPlan.severity === 'urgent' ? 'caution' : 'default'}
              title={remediationPlan.title}
              description={remediationPlan.summary}
            />

            {/* Priority 1 — Immediate */}
            {remediationPlan.actions.filter((a) => a.priority === 1).length > 0 && (
              <Box css={{ stack: 'y', gap: 'small' }}>
                <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
                  DO IMMEDIATELY
                </Inline>
                {remediationPlan.actions.filter((a) => a.priority === 1).map((action) => (
                  <Box key={action.title} css={{ padding: 'small', backgroundColor: 'container', stack: 'y', gap: 'xxsmall' }}>
                    <Inline css={{ font: 'body', fontWeight: 'bold' }}>
                      {action.title}
                    </Inline>
                    <Inline css={{ font: 'caption', color: 'secondary' }}>
                      {action.description}
                    </Inline>
                    {action.stripeLink && (
                      <Link href={action.stripeLink} target="_blank" external type="secondary">
                        Open in Stripe
                      </Link>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Priority 2 — This week */}
            {remediationPlan.actions.filter((a) => a.priority === 2).length > 0 && (
              <Box css={{ stack: 'y', gap: 'small' }}>
                <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
                  DO THIS WEEK
                </Inline>
                {remediationPlan.actions.filter((a) => a.priority === 2).map((action) => (
                  <Box key={action.title} css={{ padding: 'small', backgroundColor: 'container', stack: 'y', gap: 'xxsmall' }}>
                    <Inline css={{ font: 'body', fontWeight: 'bold' }}>
                      {action.title}
                    </Inline>
                    <Inline css={{ font: 'caption', color: 'secondary' }}>
                      {action.description}
                    </Inline>
                    {action.stripeLink && (
                      <Link href={action.stripeLink} target="_blank" external type="secondary">
                        Open in Stripe
                      </Link>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Priority 3 — Ongoing */}
            {remediationPlan.actions.filter((a) => a.priority === 3).length > 0 && (
              <Box css={{ stack: 'y', gap: 'small' }}>
                <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
                  ONGOING
                </Inline>
                {remediationPlan.actions.filter((a) => a.priority === 3).map((action) => (
                  <Box key={action.title} css={{ padding: 'small', backgroundColor: 'container', stack: 'y', gap: 'xxsmall' }}>
                    <Inline css={{ font: 'body', fontWeight: 'bold' }}>
                      {action.title}
                    </Inline>
                    <Inline css={{ font: 'caption', color: 'secondary' }}>
                      {action.description}
                    </Inline>
                    {action.stripeLink && (
                      <Link href={action.stripeLink} target="_blank" external type="secondary">
                        Open in Stripe
                      </Link>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </FocusView>
      )}

      {/* ── PROJECTIONS ──────────────────────── */}
      {hasProjections && (
        <>
          <Divider />
          <Box css={{ padding: 'medium' }}>
            <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
              <Icon name="clock" size="small" />
              <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
                Threshold Countdown
              </Inline>
            </Box>
            <Inline css={{ font: 'caption', color: 'secondary', marginBottom: 'small' }}>
              Days until breach at current trajectory
            </Inline>
            {metrics.projections.daysUntilCMM !== null && (
              <Box css={{ stack: 'x', distribute: 'space-between', marginBottom: 'xxsmall' }}>
                <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                  <Icon name="warning" size="xsmall" />
                  <Inline css={{ font: 'body' }}>Mastercard CMM 1.0%</Inline>
                </Box>
                <Badge type={metrics.projections.daysUntilCMM <= 14 ? 'negative' : metrics.projections.daysUntilCMM <= 30 ? 'warning' : 'info'}>
                  {metrics.projections.daysUntilCMM === 0 ? 'Breached' : `${metrics.projections.daysUntilCMM}d`}
                </Badge>
              </Box>
            )}
            {metrics.projections.daysUntilVAMP !== null && (
              <Box css={{ stack: 'x', distribute: 'space-between', marginBottom: 'xxsmall' }}>
                <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                  <Icon name="warning" size="xsmall" />
                  <Inline css={{ font: 'body' }}>Visa VAMP 1.5%</Inline>
                </Box>
                <Badge type={metrics.projections.daysUntilVAMP <= 14 ? 'negative' : metrics.projections.daysUntilVAMP <= 30 ? 'warning' : 'info'}>
                  {metrics.projections.daysUntilVAMP === 0 ? 'Breached' : `${metrics.projections.daysUntilVAMP}d`}
                </Badge>
              </Box>
            )}
            {metrics.projections.daysUntilEnumeration !== null && (
              <Box css={{ stack: 'x', distribute: 'space-between' }}>
                <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                  <Icon name="warning" size="xsmall" />
                  <Inline css={{ font: 'body' }}>Visa Enumeration 20%</Inline>
                </Box>
                <Badge type={metrics.projections.daysUntilEnumeration <= 14 ? 'negative' : metrics.projections.daysUntilEnumeration <= 30 ? 'warning' : 'info'}>
                  {metrics.projections.daysUntilEnumeration === 0 ? 'Breached' : `${metrics.projections.daysUntilEnumeration}d`}
                </Badge>
              </Box>
            )}
          </Box>
        </>
      )}

      <Divider />

      {/* ── VELOCITY STATUS ──────────────────── */}
      {velocity && (
        <>
          {velocity.overallStatus === 'normal' ? (
            <Box css={{ paddingX: 'medium', paddingY: 'small' }}>
              <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center' }}>
                <Icon name="shieldCheck" size="small" css={{ fill: 'success' }} />
                <Inline css={{ font: 'body' }}>Velocity: Normal</Inline>
                <Badge type="positive">OK</Badge>
              </Box>
            </Box>
          ) : (
            <Box css={{ padding: 'medium' }}>
              <Banner
                type={velocity.overallStatus === 'critical' ? 'critical' : 'caution'}
                title={`Velocity: ${velocity.overallStatus === 'critical' ? 'Critical' : 'Elevated'}`}
                description={velocity.summary}
              />
              <Box css={{ stack: 'y', gap: 'xxsmall', marginTop: 'small' }}>
                {velocity.declineVelocity.isAnomaly && (
                  <Box css={{ stack: 'x', distribute: 'space-between' }}>
                    <Inline css={{ font: 'caption' }}>Declines today</Inline>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {velocity.declineVelocity.current} (avg: {Math.round(velocity.declineVelocity.mean)})
                    </Inline>
                  </Box>
                )}
                {velocity.chargeVelocity.isAnomaly && (
                  <Box css={{ stack: 'x', distribute: 'space-between' }}>
                    <Inline css={{ font: 'caption' }}>Charges today</Inline>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {velocity.chargeVelocity.current} (avg: {Math.round(velocity.chargeVelocity.mean)})
                    </Inline>
                  </Box>
                )}
                <Inline css={{ font: 'caption', color: 'secondary', marginTop: 'xsmall' }}>
                  Review Radar logs for unusual patterns. Consider enabling CAPTCHA or rate limiting.
                </Inline>
              </Box>
            </Box>
          )}

          <Divider />
        </>
      )}

      {/* ── 30-DAY STATS ─────────────────────── */}
      <Box css={{ padding: 'medium' }}>
        <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
          <Icon name="barChart" size="small" />
          <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
            30-Day Summary
          </Inline>
        </Box>
        <Box css={{ stack: 'y', gap: 'xxsmall' }}>
          <Box css={{ stack: 'x', distribute: 'space-between' }}>
            <Inline css={{ font: 'body' }}>Charges</Inline>
            <Inline css={{ font: 'body', fontWeight: 'bold' }}>{metrics.totalCharges.toLocaleString()}</Inline>
          </Box>
          <Box css={{ stack: 'x', distribute: 'space-between' }}>
            <Inline css={{ font: 'body' }}>Disputes</Inline>
            <Inline css={{ font: 'body', fontWeight: 'bold' }}>{metrics.totalDisputes}</Inline>
          </Box>
          <Box css={{ stack: 'x', distribute: 'space-between' }}>
            <Inline css={{ font: 'body' }}>Fraud warnings</Inline>
            <Inline css={{ font: 'body', fontWeight: 'bold' }}>{metrics.totalFraudWarnings}</Inline>
          </Box>
          <Box css={{ stack: 'x', distribute: 'space-between' }}>
            <Inline css={{ font: 'body' }}>Restrictions</Inline>
            <Badge type={metrics.activeRestrictions > 0 ? 'negative' : 'positive'}>
              {metrics.activeRestrictions > 0 ? `${metrics.activeRestrictions} active` : 'None'}
            </Badge>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* ── WEEK OVER WEEK ───────────────────── */}
      {metrics.weeklyComparison && (
        <>
          <Box css={{ padding: 'medium' }}>
            <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
              <Icon name="clock" size="small" />
              <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
                Week over Week
              </Inline>
            </Box>

            {!metrics.weeklyComparison.hasEnoughData ? (
              <Inline css={{ font: 'body', color: 'secondary' }}>
                Not enough data for weekly comparison
              </Inline>
            ) : (
              <Box css={{ stack: 'y', gap: 'small' }}>
                {/* Column headers */}
                <Box css={{ stack: 'x', distribute: 'space-between' }}>
                  <Inline css={{ font: 'caption', color: 'secondary' }}> </Inline>
                  <Box css={{ stack: 'x', gap: 'large' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>This Week</Inline>
                    <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>Last Week</Inline>
                    <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>Change</Inline>
                  </Box>
                </Box>

                {/* Dispute Ratio */}
                <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}>
                  <Inline css={{ font: 'caption' }}>Dispute ratio</Inline>
                  <Box css={{ stack: 'x', gap: 'large', alignY: 'center' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {fmt(metrics.weeklyComparison.thisWeek.avgDisputeRatio)}
                    </Inline>
                    <Inline css={{ font: 'caption' }}>
                      {fmt(metrics.weeklyComparison.lastWeek.avgDisputeRatio)}
                    </Inline>
                    <Inline css={{ font: 'caption', color: metrics.weeklyComparison.changes.disputeRatio.direction === 'down' ? 'success' : metrics.weeklyComparison.changes.disputeRatio.direction === 'up' ? 'critical' : 'secondary' }}>
                      {metrics.weeklyComparison.changes.disputeRatio.direction === 'up' ? '\u2191' : metrics.weeklyComparison.changes.disputeRatio.direction === 'down' ? '\u2193' : '\u2192'} {fmt(Math.abs(metrics.weeklyComparison.changes.disputeRatio.delta))}
                    </Inline>
                  </Box>
                </Box>

                {/* Fraud Ratio */}
                <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}>
                  <Inline css={{ font: 'caption' }}>Fraud ratio</Inline>
                  <Box css={{ stack: 'x', gap: 'large', alignY: 'center' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {fmt(metrics.weeklyComparison.thisWeek.avgFraudRatio)}
                    </Inline>
                    <Inline css={{ font: 'caption' }}>
                      {fmt(metrics.weeklyComparison.lastWeek.avgFraudRatio)}
                    </Inline>
                    <Inline css={{ font: 'caption', color: metrics.weeklyComparison.changes.fraudRatio.direction === 'down' ? 'success' : metrics.weeklyComparison.changes.fraudRatio.direction === 'up' ? 'critical' : 'secondary' }}>
                      {metrics.weeklyComparison.changes.fraudRatio.direction === 'up' ? '\u2191' : metrics.weeklyComparison.changes.fraudRatio.direction === 'down' ? '\u2193' : '\u2192'} {fmt(Math.abs(metrics.weeklyComparison.changes.fraudRatio.delta))}
                    </Inline>
                  </Box>
                </Box>

                {/* Decline Rate */}
                <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}>
                  <Inline css={{ font: 'caption' }}>Decline rate</Inline>
                  <Box css={{ stack: 'x', gap: 'large', alignY: 'center' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {fmt(metrics.weeklyComparison.thisWeek.avgDeclineRate)}
                    </Inline>
                    <Inline css={{ font: 'caption' }}>
                      {fmt(metrics.weeklyComparison.lastWeek.avgDeclineRate)}
                    </Inline>
                    <Inline css={{ font: 'caption', color: metrics.weeklyComparison.changes.declineRate.direction === 'down' ? 'success' : metrics.weeklyComparison.changes.declineRate.direction === 'up' ? 'critical' : 'secondary' }}>
                      {metrics.weeklyComparison.changes.declineRate.direction === 'up' ? '\u2191' : metrics.weeklyComparison.changes.declineRate.direction === 'down' ? '\u2193' : '\u2192'} {fmt(Math.abs(metrics.weeklyComparison.changes.declineRate.delta))}
                    </Inline>
                  </Box>
                </Box>

                {/* Health Score */}
                <Box css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}>
                  <Inline css={{ font: 'caption' }}>Health score</Inline>
                  <Box css={{ stack: 'x', gap: 'large', alignY: 'center' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'bold' }}>
                      {metrics.weeklyComparison.thisWeek.avgHealthScore}
                    </Inline>
                    <Inline css={{ font: 'caption' }}>
                      {metrics.weeklyComparison.lastWeek.avgHealthScore}
                    </Inline>
                    <Inline css={{ font: 'caption', color: metrics.weeklyComparison.changes.healthScore.direction === 'up' ? 'success' : metrics.weeklyComparison.changes.healthScore.direction === 'down' ? 'critical' : 'secondary' }}>
                      {metrics.weeklyComparison.changes.healthScore.direction === 'up' ? '\u2191' : metrics.weeklyComparison.changes.healthScore.direction === 'down' ? '\u2193' : '\u2192'} {Math.abs(metrics.weeklyComparison.changes.healthScore.delta)}pts
                    </Inline>
                  </Box>
                </Box>

                {/* Summary */}
                <Inline css={{ font: 'caption', color: 'secondary', marginTop: 'xsmall' }}>
                  {metrics.weeklyComparison.summary}
                </Inline>
              </Box>
            )}
          </Box>

          <Divider />
        </>
      )}

      {/* ── RECENT DISPUTES ──────────────────── */}
      <Box css={{ padding: 'medium' }}>
        <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
          <Icon name="dispute" size="small" />
          <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
            Recent Disputes
          </Inline>
        </Box>
        {disputes.length === 0 ? (
          <Inline css={{ font: 'body', color: 'secondary' }}>
            No disputes in the last 30 days
          </Inline>
        ) : (
          <Box css={{ stack: 'y', gap: 'small' }}>
            {disputes.slice(0, 5).map((d) => (
              <Box key={d.id} css={{ stack: 'y', gap: 'xxsmall', padding: 'small', backgroundColor: 'container' }}>
                <Box
                  css={{ stack: 'x', distribute: 'space-between', alignY: 'center' }}
                >
                  <Button
                    type="secondary"
                    size="small"
                    onPress={() => setExpandedDispute(expandedDispute === d.id ? null : d.id)}
                  >
                    {`$${(d.amount / 100).toFixed(2)}`} · {d.reason.replace(/_/g, ' ')}
                  </Button>
                  <Badge type={d.guidance.priority === 'high' ? 'negative' : d.guidance.priority === 'medium' ? 'warning' : 'info'}>
                    {d.guidance.priority}
                  </Badge>
                </Box>
                <Inline css={{ font: 'caption', color: 'secondary' }}>
                  +{d.ratioImpact.toFixed(3)}% impact · {new Date(d.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {d.respondBy ? ` · Respond by ${new Date(d.respondBy * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </Inline>
                {expandedDispute === d.id && (
                  <Box css={{ stack: 'y', gap: 'xxsmall', marginTop: 'xsmall' }}>
                    <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
                      ~{d.guidance.winRate} win rate
                    </Inline>
                    <Inline css={{ font: 'caption', color: 'secondary' }}>
                      {d.guidance.advice}
                    </Inline>
                    <Inline css={{ font: 'caption', fontWeight: 'semibold', marginTop: 'xxsmall' }}>
                      Evidence to submit:
                    </Inline>
                    <Inline css={{ font: 'caption', color: 'secondary' }}>
                      {d.guidance.evidenceFields.map((f) => EVIDENCE_LABELS[f] || f.replace(/_/g, ' ')).join(', ')}
                    </Inline>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Divider />

      {/* ── BENCHMARK ────────────────────────── */}
      <Box css={{ padding: 'medium' }}>
        <Box css={{ stack: 'x', gap: 'xsmall', alignY: 'center', marginBottom: 'small' }}>
          <Icon name="growth" size="small" />
          <Inline css={{ font: 'subheading', fontWeight: 'bold' }}>
            Industry Benchmark
          </Inline>
        </Box>
        <Box css={{ stack: 'x', distribute: 'space-between', marginBottom: 'xsmall' }}>
          <Box css={{ stack: 'y', gap: 'xxsmall' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>Your ratio</Inline>
            <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
              {fmt(metrics.benchmark.merchantRatio)}
            </Inline>
          </Box>
          <Box css={{ stack: 'y', gap: 'xxsmall', alignX: 'end' }}>
            <Inline css={{ font: 'caption', color: 'secondary' }}>{metrics.benchmark.industryName}</Inline>
            <Inline css={{ font: 'heading', fontWeight: 'bold' }}>
              {fmt(metrics.benchmark.averageDisputeRatio)}
            </Inline>
          </Box>
        </Box>
        <Inline css={{
          font: 'caption',
          color: metrics.benchmark.performance === 'below_average' ? 'success'
            : metrics.benchmark.performance === 'average' ? 'secondary'
            : 'critical',
        }}>
          {metrics.benchmark.performance === 'below_average'
            ? 'Outperforming your industry'
            : metrics.benchmark.performance === 'average'
            ? 'Average for your industry'
            : 'Above industry average'}
        </Inline>
      </Box>

      {/* ── FOOTER ───────────────────────────── */}
      <Divider />
      <Box css={{ padding: 'medium', stack: 'x', distribute: 'space-between', alignY: 'center' }}>
        <Inline css={{ font: 'caption', color: 'secondary' }}>
          {new Date(metrics.lastUpdated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Inline>
        <Box css={{ stack: 'x', gap: 'xxsmall', alignY: 'center' }}>
          <Icon name="lock" size="xsmall" />
          <Inline css={{ font: 'caption', color: 'secondary' }}>Read-only</Inline>
        </Box>
      </Box>
    </ContextView>
  );
};

export default DashboardView;
