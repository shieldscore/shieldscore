/**
 * Seeds realistic "warning-level" data to showcase the full ShieldScore dashboard.
 * Creates a merchant with elevated dispute ratios, upward trends, alerts, and restrictions.
 *
 * Usage: npx tsx scripts/seed-realistic-data.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  process.env[t.slice(0, i)] = t.slice(i + 1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STRIPE_ACCOUNT_ID = 'acct_1TLJKl21BRZbf1Ps';

async function seed() {
  // 1. Find or create the merchant for this Stripe account
  const { data: existing } = await supabase
    .from('merchants')
    .select('id')
    .eq('stripe_account_id', STRIPE_ACCOUNT_ID)
    .single();

  let merchantId: string;

  if (existing) {
    merchantId = existing.id;
    // Update MCC code for benchmark demo
    await supabase
      .from('merchants')
      .update({ mcc_code: '5817' }) // Digital Goods — avg 0.8%
      .eq('id', merchantId);
    console.log('Using existing merchant:', merchantId);
  } else {
    const { data: created, error } = await supabase
      .from('merchants')
      .insert({
        stripe_account_id: STRIPE_ACCOUNT_ID,
        email: 'demo@shieldscore.io',
        plan: 'monitor',
        mcc_code: '5817',
      })
      .select('id')
      .single();
    if (error) { console.error('Create merchant failed:', error); return; }
    merchantId = created!.id;
    console.log('Created merchant:', merchantId);
  }

  // 2. Delete old data for clean slate
  await Promise.all([
    supabase.from('daily_metrics').delete().eq('merchant_id', merchantId),
    supabase.from('alerts').delete().eq('merchant_id', merchantId),
    supabase.from('restrictions').delete().eq('merchant_id', merchantId),
    supabase.from('events').delete().eq('merchant_id', merchantId),
  ]);

  // 3. Generate 14 days of daily metrics with a realistic upward trend
  const today = new Date();
  const rows = [];
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    // Progress from day 0 (oldest) to day 13 (today): 0.0 → 1.0
    const progress = (13 - daysAgo) / 13;

    // Dispute ratio: starts at 0.35%, trends up to 0.78%
    const disputeRatio = 0.0035 + progress * 0.0043 + (Math.random() * 0.0005 - 0.00025);

    // Fraud ratio: starts at 0.08%, trends up to 0.22%
    const fraudRatio = 0.0008 + progress * 0.0014 + (Math.random() * 0.0003 - 0.00015);

    // Decline rate: starts at 6%, trends up to 13%
    const declineRate = 0.06 + progress * 0.07 + (Math.random() * 0.01 - 0.005);

    const totalCharges = 2800 + Math.round(Math.random() * 400);
    const totalDisputes = Math.round(disputeRatio * totalCharges);
    const totalFraudWarnings = Math.round(fraudRatio * totalCharges);
    const totalDeclines = Math.round(declineRate * totalCharges);
    const totalRefunds = 25 + Math.round(Math.random() * 15);

    // Health score: degrades as ratios increase
    let healthScore = 100;
    const vampRatio = fraudRatio + disputeRatio;
    if (vampRatio >= 0.015) healthScore -= 50;
    else if (vampRatio >= 0.01) healthScore -= 30;
    else if (vampRatio >= 0.005) healthScore -= 10;
    if (disputeRatio >= 0.015) healthScore -= 30;
    else if (disputeRatio >= 0.01) healthScore -= 15;
    else if (disputeRatio >= 0.005) healthScore -= 5;
    if (declineRate >= 0.20) healthScore -= 20;
    else if (declineRate >= 0.10) healthScore -= 10;
    // Apply restriction penalty (-15) to match calculations.ts behavior
    // Only the most recent days reflect the restriction being active
    if (daysAgo <= 3) healthScore -= 15;
    healthScore = Math.max(0, Math.min(100, healthScore));

    rows.push({
      merchant_id: merchantId,
      date: dateStr,
      total_charges: totalCharges,
      total_disputes: totalDisputes,
      total_fraud_warnings: totalFraudWarnings,
      total_refunds: totalRefunds,
      total_declines: totalDeclines,
      dispute_ratio: parseFloat(disputeRatio.toFixed(6)),
      fraud_ratio: parseFloat(fraudRatio.toFixed(6)),
      decline_rate: parseFloat(declineRate.toFixed(6)),
      health_score: healthScore,
    });
  }

  const { error: metricsErr } = await supabase.from('daily_metrics').insert(rows);
  if (metricsErr) { console.error('Metrics insert failed:', metricsErr); return; }
  console.log(`Inserted ${rows.length} daily_metrics rows (14-day history)`);

  // Print latest day stats
  const latest = rows[rows.length - 1];
  console.log(`  Latest: dispute=${(latest.dispute_ratio * 100).toFixed(2)}%, fraud=${(latest.fraud_ratio * 100).toFixed(2)}%, decline=${(latest.decline_rate * 100).toFixed(2)}%, health=${latest.health_score}`);

  // 4. Insert realistic alerts
  const alertsData = [
    {
      merchant_id: merchantId,
      alert_type: 'threshold_warning',
      severity: 'info',
      title: 'Dispute ratio elevated at 0.50%',
      message: 'Your dispute ratio is 0.50%. Still below warning thresholds but worth monitoring.',
      delivered_via: ['email'],
      acknowledged: true,
      created_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    },
    {
      merchant_id: merchantId,
      alert_type: 'threshold_warning',
      severity: 'warning',
      title: 'Dispute ratio approaching danger at 0.75%',
      message: 'Your dispute ratio is 0.75%, approaching the 1.0% Mastercard CMM threshold. Review recent disputes.',
      delivered_via: ['email', 'slack'],
      acknowledged: false,
      created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    },
    {
      merchant_id: merchantId,
      alert_type: 'threshold_warning',
      severity: 'warning',
      title: 'Decline rate elevated at 12.5%',
      message: 'Your decline rate is 12.5%, approaching the 20% Visa enumeration threshold. Monitor for unusual patterns.',
      delivered_via: ['email'],
      acknowledged: false,
      created_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    },
    {
      merchant_id: merchantId,
      alert_type: 'restriction_detected',
      severity: 'critical',
      title: 'Account capability under review',
      message: 'Stripe has placed your card_payments capability under review. Additional documentation may be requested.',
      delivered_via: ['email', 'slack', 'sms'],
      acknowledged: false,
      created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    },
  ];

  const { error: alertsErr } = await supabase.from('alerts').insert(alertsData);
  if (alertsErr) { console.error('Alerts insert failed:', alertsErr); return; }
  console.log(`Inserted ${alertsData.length} alerts (info, warning, critical)`);

  // 5. Insert dispute events so "Recent Disputes" section has data
  // Must match the total_disputes count from daily_metrics for consistency
  const totalSeededDisputes = latest.total_disputes;
  const disputeReasons = ['fraudulent', 'product_not_received', 'credit_not_processed', 'duplicate', 'general', 'subscription_canceled', 'unrecognized', 'product_unacceptable'];
  const disputeStatuses = ['needs_response', 'needs_response', 'needs_response', 'under_review', 'under_review', 'won', 'lost'];
  const disputeEvents = [];
  for (let i = 0; i < totalSeededDisputes; i++) {
    const daysAgo = Math.floor(Math.random() * 28) + 1;
    const reason = disputeReasons[i % disputeReasons.length];
    const status = disputeStatuses[i % disputeStatuses.length];
    const amount = Math.floor(Math.random() * 30000) + 1500; // $15 - $315 in cents
    const respondByDate = status === 'needs_response'
      ? Math.floor((Date.now() + (7 + Math.floor(Math.random() * 14)) * 24 * 3600000) / 1000)
      : null;
    disputeEvents.push({
      merchant_id: merchantId,
      stripe_event_id: `evt_demo_dispute_${i}_${Date.now()}`,
      event_type: 'charge.dispute.created',
      // JSONB column — pass a plain object, NOT JSON.stringify
      payload: {
        object: {
          id: `dp_demo_${i}`,
          amount,
          currency: 'usd',
          status,
          reason,
          charge: `ch_demo_${i}`,
          evidence_details: respondByDate ? { due_by: respondByDate } : null,
        },
      },
      processed: true,
      created_at: new Date(Date.now() - daysAgo * 24 * 3600000).toISOString(),
    });
  }
  const { error: eventsErr } = await supabase.from('events').insert(disputeEvents);
  if (eventsErr) { console.error('Events insert failed:', eventsErr); return; }
  console.log(`Inserted ${disputeEvents.length} dispute events for Recent Disputes section`);

  // 6. Insert an active restriction
  const { error: restrictionErr } = await supabase.from('restrictions').insert({
    merchant_id: merchantId,
    restriction_type: 'capability_pending',
    details: JSON.stringify({
      capability: 'card_payments',
      status: 'pending',
      requirements: ['identity_document', 'company_registration'],
    }),
    resolved: false,
  });
  if (restrictionErr) { console.error('Restriction insert failed:', restrictionErr); return; }
  console.log('Inserted 1 active restriction (capability_pending)');

  console.log('\nDone! Refresh the Stripe Dashboard to see the updated ShieldScore.');
  console.log(`Merchant ID: ${merchantId}`);
  console.log(`Test with: curl http://localhost:3000/api/metrics/${STRIPE_ACCOUNT_ID}`);
}

seed().catch(console.error);
