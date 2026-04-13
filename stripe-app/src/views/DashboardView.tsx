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
  Accordion,
  AccordionItem,
} from '@stripe/ui-extension-sdk/ui';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { getDashboardUserEmail } from '@stripe/ui-extension-sdk/utils';
import { fetchStripeSignature } from '@stripe/ui-extension-sdk/utils';
import { useState, useEffect, useCallback } from 'react';
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
  lastUpdated: string;
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

// TODO: Change to https://shieldscore.io/api before deploying
const BACKEND_URL = 'http://localhost:3000/api';

const DashboardView = ({ userContext, environment }: ExtensionContextValue) => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [expandedDispute, setExpandedDispute] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const accountId = environment?.objectContext?.id || userContext?.account?.id;
      if (!accountId) {
        setError('Could not determine Stripe account ID');
        return;
      }

      // Try to fetch metrics
      let response = await fetch(`${BACKEND_URL}/metrics/${accountId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      // If merchant not found, onboard them first
      if (response.status === 404) {
        // Get email for the merchant record (best-effort)
        let email: string | null = null;
        try {
          const emailResult = await getDashboardUserEmail();
          email = emailResult.email;
        } catch {
          // Email not available — that's fine, it's optional
        }

        // Get Stripe signature for backend verification
        let signature: string | undefined;
        try {
          signature = await fetchStripeSignature();
        } catch {
          // Signature not available in dev mode — skip
        }

        const onboardHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (signature) {
          onboardHeaders['Stripe-Signature'] = signature;
        }

        const onboardResponse = await fetch(`${BACKEND_URL}/onboard`, {
          method: 'POST',
          headers: onboardHeaders,
          body: JSON.stringify({ stripeAccountId: accountId, email }),
        });

        if (!onboardResponse.ok) {
          throw new Error('Failed to set up your account');
        }

        // Give the initial sync a moment to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Retry fetching metrics
        response = await fetch(`${BACKEND_URL}/metrics/${accountId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data: MetricsResponse = await response.json();
      setMetrics(data);
      setLastChecked(new Date());
      setError(null);

      // Fetch recent disputes
      try {
        const disputeRes = await fetch(`${BACKEND_URL}/disputes/${accountId}?limit=5`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (disputeRes.ok) {
          const disputeData = await disputeRes.json();
          setDisputes(disputeData.disputes || []);
        }
      } catch {
        // Disputes are non-critical — don't block the dashboard
      }
    } catch (err) {
      setError('Unable to load health data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [environment, userContext]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const fmt = (ratio: number): string => `${(ratio * 100).toFixed(2)}%`;

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
  if (loading) {
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

  // ── Error ────────────────────────────────────
  if (error || !metrics) {
    return (
      <ContextView title="ShieldScore" brandIcon={BrandIcon}>
        <Box css={{ padding: 'medium', stack: 'y', gap: 'medium' }}>
          <Banner
            type="critical"
            title="Connection error"
            description={error || 'Failed to load data'}
          />
          <Button type="primary" onPress={fetchMetrics}>
            Retry
          </Button>
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
              <Button type="secondary" size="small" onPress={fetchMetrics}>
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
