/**
 * Seed script: inserts a test merchant with 7 days of daily_metrics
 * and a couple of alerts so we can verify the API response shapes.
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually since dotenv isn't installed
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const value = trimmed.slice(eqIdx + 1);
  process.env[key] = value;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  // 1. Upsert test merchant
  const { error: merchantErr } = await supabase.from('merchants').upsert(
    {
      id: MERCHANT_ID,
      stripe_account_id: 'acct_test_shieldscore',
      email: 'test@shieldscore.io',
      plan: 'monitor',
      mcc_code: '5999',
    },
    { onConflict: 'id' }
  );
  if (merchantErr) {
    console.error('Merchant upsert failed:', merchantErr);
    return;
  }
  console.log('Merchant upserted:', MERCHANT_ID);

  // 2. Insert 7 days of daily_metrics with a slight upward trend
  const today = new Date();
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simulate gradual increase in dispute ratio
    const dayFactor = (6 - i) / 6; // 0 → 1 over the week
    const disputeRatio = 0.004 + dayFactor * 0.002; // 0.40% → 0.60%
    const fraudRatio = 0.001 + dayFactor * 0.0005;   // 0.10% → 0.15%
    const declineRate = 0.05 + dayFactor * 0.01;      // 5% → 6%

    rows.push({
      merchant_id: MERCHANT_ID,
      date: dateStr,
      total_charges: 1200 + i * 50,
      total_disputes: Math.round(disputeRatio * (1200 + i * 50)),
      total_fraud_warnings: Math.round(fraudRatio * (1200 + i * 50)),
      total_refunds: 15 + i,
      total_declines: Math.round(declineRate * (1200 + i * 50)),
      dispute_ratio: parseFloat(disputeRatio.toFixed(6)),
      fraud_ratio: parseFloat(fraudRatio.toFixed(6)),
      decline_rate: parseFloat(declineRate.toFixed(6)),
      health_score: 85 - Math.round(dayFactor * 5),
    });
  }

  // Delete existing metrics for this merchant first
  await supabase
    .from('daily_metrics')
    .delete()
    .eq('merchant_id', MERCHANT_ID);

  const { error: metricsErr } = await supabase
    .from('daily_metrics')
    .insert(rows);

  if (metricsErr) {
    console.error('Metrics insert failed:', metricsErr);
    return;
  }
  console.log(`Inserted ${rows.length} daily_metrics rows`);

  // 3. Insert sample alerts
  await supabase
    .from('alerts')
    .delete()
    .eq('merchant_id', MERCHANT_ID);

  const { error: alertsErr } = await supabase.from('alerts').insert([
    {
      merchant_id: MERCHANT_ID,
      alert_type: 'threshold_warning',
      severity: 'info',
      title: 'Dispute ratio elevated at 0.50%',
      message: 'Your dispute ratio is 0.50%. This is still below warning thresholds but worth monitoring.',
      delivered_via: JSON.stringify(['email']),
      acknowledged: false,
    },
    {
      merchant_id: MERCHANT_ID,
      alert_type: 'threshold_warning',
      severity: 'warning',
      title: 'Dispute ratio approaching danger at 0.60%',
      message: 'Your dispute ratio is 0.60%, approaching the 1.0% Mastercard CMM threshold.',
      delivered_via: JSON.stringify(['email', 'slack']),
      acknowledged: false,
    },
  ]);

  if (alertsErr) {
    console.error('Alerts insert failed:', alertsErr);
    return;
  }
  console.log('Inserted 2 sample alerts');

  console.log('\nTest merchant ID:', MERCHANT_ID);
  console.log('Test with:');
  console.log(`  curl http://localhost:3000/api/metrics/${MERCHANT_ID}`);
  console.log(`  curl http://localhost:3000/api/alerts/${MERCHANT_ID}?limit=10`);
}

seed().catch(console.error);
