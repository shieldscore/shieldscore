/**
 * Test script: renders all 5 email templates with sample data and writes HTML to disk.
 *
 * Usage:
 *   npx tsx scripts/test-email-templates.ts
 *
 * Open the generated .html files in a browser to inspect.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  thresholdWarning,
  restrictionDetected,
  vampCritical,
  declineRateWarning,
  dailyDigest,
} from '../lib/email-templates';

const outDir = path.join(__dirname, '..', '.email-test-output');
fs.mkdirSync(outDir, { recursive: true });

function writeTemplate(name: string, subject: string, html: string): void {
  const filePath = path.join(outDir, `${name}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`[OK] ${name}`);
  console.log(`     Subject: ${subject}`);
  console.log(`     File:    ${filePath}`);
  console.log();
}

// -----------------------------------------------------------------------
// A. Threshold Warning (approaching CMM)
// -----------------------------------------------------------------------
const tw = thresholdWarning({
  ratio: 0.0082,
  threshold: 'Mastercard CMM',
  thresholdValue: 0.01,
  healthScore: 62,
  merchantEmail: 'merchant@example.com',
});
writeTemplate('01-threshold-warning', tw.subject, tw.html);

// -----------------------------------------------------------------------
// B. Restriction Detected
// -----------------------------------------------------------------------
const rd = restrictionDetected({
  requirements: [
    'identity_document',
    'company.tax_id',
    'bank_account_ownership_verification',
  ],
  capabilities: [
    'card_payments: restricted',
    'transfers: pending',
  ],
  merchantEmail: 'merchant@example.com',
});
writeTemplate('02-restriction-detected', rd.subject, rd.html);

// -----------------------------------------------------------------------
// C. VAMP Critical
// -----------------------------------------------------------------------
const vc = vampCritical({
  vampRatio: 0.0178,
  fraudWarnings: 23,
  disputes: 41,
  totalCharges: 3600,
  healthScore: 18,
  merchantEmail: 'merchant@example.com',
});
writeTemplate('03-vamp-critical', vc.subject, vc.html);

// -----------------------------------------------------------------------
// D. Decline Rate Warning
// -----------------------------------------------------------------------
const dr = declineRateWarning({
  declineRate: 0.2240,
  declines: 1120,
  totalAttempts: 5000,
  merchantEmail: 'merchant@example.com',
});
writeTemplate('04-decline-rate-warning', dr.subject, dr.html);

// -----------------------------------------------------------------------
// E. Daily Digest (healthy)
// -----------------------------------------------------------------------
const dd1 = dailyDigest({
  healthScore: 85,
  disputeRatio: 0.003,
  fraudRatio: 0.001,
  declineRate: 0.04,
  disputeRatioDelta: -0.001,
  fraudRatioDelta: 0,
  alertCount: 0,
  merchantEmail: 'merchant@example.com',
});
writeTemplate('05-daily-digest-healthy', dd1.subject, dd1.html);

// Daily Digest (caution)
const dd2 = dailyDigest({
  healthScore: 48,
  disputeRatio: 0.0091,
  fraudRatio: 0.005,
  declineRate: 0.12,
  disputeRatioDelta: 0.002,
  fraudRatioDelta: 0.001,
  alertCount: 3,
  merchantEmail: 'merchant@example.com',
});
writeTemplate('06-daily-digest-caution', dd2.subject, dd2.html);

console.log(`Done. Open the HTML files in ${outDir} to preview.`);
