/**
 * Remediation Plan Generator
 *
 * Generates actionable, prioritized remediation plans based on current metrics.
 * Plans are deterministic — same inputs always produce the same plan.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemediationAction {
  priority: 1 | 2 | 3;
  category: 'fraud_prevention' | 'dispute_response' | 'checkout_optimization' | 'policy_update' | 'monitoring';
  title: string;
  description: string;
  stripeLink: string | null;
}

export interface RemediationPlan {
  severity: 'none' | 'advisory' | 'urgent' | 'critical';
  title: string;
  summary: string;
  actions: RemediationAction[];
  generatedAt: string;
}

interface MetricInputs {
  disputeRatio: number;
  fraudRatio: number;
  declineRate: number;
  healthScore: number;
  totalDisputes: number;
  totalCharges: number;
  hasRestrictions: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const DISPUTE_APPROACHING = 0.005;
const DISPUTE_CMM = 0.01;
const DISPUTE_VAMP = 0.015;
const FRAUD_ELEVATED = 0.005;
const DECLINE_ELEVATED = 0.10;
const DECLINE_ENUMERATION = 0.20;

// ---------------------------------------------------------------------------
// Action builders
// ---------------------------------------------------------------------------

function disputeActions(ratio: number, isUrgent: boolean): RemediationAction[] {
  const actions: RemediationAction[] = [];

  actions.push({
    priority: 1,
    category: 'dispute_response',
    title: 'Respond to all open disputes',
    description: 'Submit evidence for every open dispute within 24 hours. Even disputes you expect to lose. Responding shows card networks you\'re actively managing the issue.',
    stripeLink: 'https://dashboard.stripe.com/disputes?status=needs_response',
  });

  actions.push({
    priority: 1,
    category: 'fraud_prevention',
    title: 'Enable 3D Secure',
    description: 'Enable 3D Secure authentication for all transactions above your average order value. This shifts fraud liability to the card issuer and excludes authenticated transactions from your dispute ratio.',
    stripeLink: 'https://dashboard.stripe.com/settings/radar/rules',
  });

  if (isUrgent) {
    actions.push({
      priority: 2,
      category: 'policy_update',
      title: 'Review billing descriptor',
      description: 'Make sure your statement descriptor matches the name customers recognize. Unclear descriptors cause \'unrecognized\' disputes. Check Settings > Public details.',
      stripeLink: 'https://dashboard.stripe.com/settings/public',
    });
  }

  actions.push({
    priority: isUrgent ? 2 : 3,
    category: 'checkout_optimization',
    title: 'Improve customer communication',
    description: 'Add tracking numbers to all shipments. Send proactive delivery updates. Make your refund policy visible at checkout. Most disputes happen because customers can\'t reach you or don\'t know your policy.',
    stripeLink: null,
  });

  if (ratio >= DISPUTE_CMM) {
    actions.push({
      priority: 3,
      category: 'monitoring',
      title: 'Set up pre-dispute alerts',
      description: 'Enable Visa Compelling Evidence 3.0 and Ethoca/Verifi alerts through Stripe to resolve disputes before they become chargebacks.',
      stripeLink: null,
    });
  }

  return actions;
}

function fraudActions(): RemediationAction[] {
  return [
    {
      priority: 1,
      category: 'fraud_prevention',
      title: 'Review Radar rules',
      description: 'Enable Radar\'s machine learning fraud detection. Add rules to block transactions from high-risk countries, require CVC match, and set velocity limits.',
      stripeLink: 'https://dashboard.stripe.com/settings/radar/rules',
    },
    {
      priority: 1,
      category: 'fraud_prevention',
      title: 'Enable 3D Secure for high-risk transactions',
      description: 'Configure Radar rules to require 3D Secure when the risk score is elevated. This prevents fraudulent charges from counting against your VAMP ratio.',
      stripeLink: null,
    },
    {
      priority: 2,
      category: 'fraud_prevention',
      title: 'Audit recent fraud warnings',
      description: 'Review your TC40 fraud reports. Consider proactively refunding charges that have fraud warnings before customers file formal disputes.',
      stripeLink: 'https://dashboard.stripe.com/radar/early-fraud-warnings',
    },
  ];
}

function declineActions(): RemediationAction[] {
  return [
    {
      priority: 1,
      category: 'checkout_optimization',
      title: 'Enable CAPTCHA on checkout',
      description: 'High decline rates usually indicate card-testing bot activity. Add CAPTCHA or reCAPTCHA to your checkout page to block automated attempts.',
      stripeLink: null,
    },
    {
      priority: 1,
      category: 'fraud_prevention',
      title: 'Add velocity rules in Radar',
      description: 'Block more than 3 failed charge attempts from the same card or IP address within 1 hour.',
      stripeLink: 'https://dashboard.stripe.com/settings/radar/rules',
    },
    {
      priority: 2,
      category: 'monitoring',
      title: 'Review declined transactions',
      description: 'Check for patterns: same IP address, same BIN range, rapid-fire attempts. Report card-testing activity to Stripe support.',
      stripeLink: null,
    },
  ];
}

function restrictionActions(): RemediationAction[] {
  return [
    {
      priority: 1,
      category: 'policy_update',
      title: 'Complete pending requirements',
      description: 'Go to Settings > Account details and submit all requested documents immediately. Every day of delay increases the risk of further restrictions.',
      stripeLink: 'https://dashboard.stripe.com/settings/account',
    },
    {
      priority: 1,
      category: 'monitoring',
      title: 'Contact Stripe support',
      description: 'Open a support case explaining what steps you\'ve taken to address the issue. Be specific and professional.',
      stripeLink: 'https://support.stripe.com',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateRemediationPlan(metrics: MetricInputs): RemediationPlan {
  const { disputeRatio, fraudRatio, declineRate, healthScore, hasRestrictions } = metrics;

  // Determine severity
  let severity: RemediationPlan['severity'] = 'none';
  let title = 'No action needed';
  let summary = 'Your account health is good. Continue monitoring.';

  if (disputeRatio >= DISPUTE_VAMP || healthScore < 20) {
    severity = 'critical';
    title = 'Immediate action required';
    summary = `Your dispute ratio is ${(disputeRatio * 100).toFixed(2)}% — at or above the 1.5% VAMP/ECM penalty threshold. Take immediate corrective action to avoid fines and potential account termination.`;
  } else if (disputeRatio >= DISPUTE_CMM || healthScore < 40) {
    severity = 'urgent';
    title = 'Action required to avoid penalties';
    summary = `Your dispute ratio is ${(disputeRatio * 100).toFixed(2)}% — in the Mastercard CMM warning zone. Address the issues below before crossing the 1.5% penalty threshold.`;
  } else if (disputeRatio >= DISPUTE_APPROACHING || healthScore < 70) {
    severity = 'advisory';
    title = 'Preventive measures recommended';
    summary = `Your metrics are trending upward. Taking preventive action now can avoid future threshold breaches.`;
  }

  if (hasRestrictions && severity === 'none') {
    severity = 'urgent';
    title = 'Action required — account restrictions active';
    summary = 'Stripe has placed restrictions on your account. Complete pending requirements immediately.';
  } else if (hasRestrictions && severity !== 'critical') {
    severity = 'critical';
    title = 'Immediate action required';
    summary = `Account restrictions are active and your dispute ratio is ${(disputeRatio * 100).toFixed(2)}%. Address both issues immediately.`;
  }

  if (severity === 'none') {
    return {
      severity: 'none',
      title,
      summary,
      actions: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Build actions based on what's elevated
  const actions: RemediationAction[] = [];
  const isUrgentOrCritical = severity === 'urgent' || severity === 'critical';

  if (disputeRatio >= DISPUTE_APPROACHING) {
    actions.push(...disputeActions(disputeRatio, isUrgentOrCritical));
  }

  if (fraudRatio >= FRAUD_ELEVATED) {
    actions.push(...fraudActions());
  }

  if (declineRate >= DECLINE_ELEVATED) {
    actions.push(...declineActions());
  }

  if (hasRestrictions) {
    actions.push(...restrictionActions());
  }

  // Deduplicate by title (some actions appear in multiple categories)
  const seen = new Set<string>();
  const deduped = actions.filter((a) => {
    if (seen.has(a.title)) return false;
    seen.add(a.title);
    return true;
  });

  // Sort by priority
  deduped.sort((a, b) => a.priority - b.priority);

  return {
    severity,
    title,
    summary,
    actions: deduped,
    generatedAt: new Date().toISOString(),
  };
}
