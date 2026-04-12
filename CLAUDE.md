# CLAUDE.md — ShieldScore Project Instructions

## What This Project Is

ShieldScore is a Stripe App that provides real-time account health monitoring for Stripe merchants. It tracks dispute and fraud ratios against 2026 card network thresholds (Visa VAMP, Mastercard CMM/ECM), monitors for hidden account restrictions, and alerts merchants before Stripe's automated systems freeze their account.

**One-line pitch:** "Know before Stripe freezes you."

The app lives inside the Stripe Dashboard as a UI Extension. It does NOT have a separate website login. Merchants install it from the Stripe App Marketplace and see it directly in their dashboard.

---

## Tech Stack (DO NOT DEVIATE)

- **Frontend (inside Stripe):** React + TypeScript using `@stripe/ui-extension-sdk/ui/next`
- **Backend / API:** Next.js (Node.js) deployed on Vercel
- **Database:** PostgreSQL via Supabase
- **Email alerts:** Resend
- **SMS alerts (Phase 2):** Twilio
- **Slack alerts (Phase 2):** Slack Incoming Webhooks
- **Hosting:** Vercel (free tier for MVP)
- **Payment for ShieldScore subscriptions:** Stripe (we use Stripe to charge our own customers)

---

## Security Model — READ-ONLY ONLY

This is the most critical architectural decision. ShieldScore uses **strictly read-only OAuth scopes** for the MVP. The app CANNOT and MUST NOT:

- Move merchant funds
- Create charges or refunds
- Modify subscriptions
- Store raw cardholder data (PAN, CVV, etc.)

**Required OAuth scopes (MVP):**

| Scope | Access | Purpose |
|-------|--------|---------|
| Accounts | Read | Monitor capabilities and restriction status |
| Charges | Read | Calculate transaction volume for ratio denominators |
| Disputes | Read | Track dispute counts for VAMP/ECM ratio numerators |
| Early Fraud Warnings | Read | Monitor TC40 fraud reports for Visa VAMP calculation |

Phase 3 adds write access for Refunds (suggested refund feature only), which requires prompting existing users to re-authenticate with upgraded scopes.

---

## Card Network Thresholds (MUST BE ACCURATE)

These are the 2026 thresholds the dashboard tracks. Get these numbers right — they are the core value proposition.

### Visa VAMP (Acquirer Monitoring Program)
- **Threshold:** 1.5% combined fraud + dispute ratio
- **Calculation:** (TC40 Fraud Reports + TC15 Disputes) / Total Settled Transactions
- **Enforcement:** Penalties begin immediately upon breach
- **Dashboard color:** RED when at or above 1.5%

### Mastercard CMM (Chargeback-Monitored Merchant) — WARNING TIER
- **Threshold:** 1.0% dispute ratio AND 100+ disputes
- **Consequence:** Formal warning from Mastercard, NO financial penalties yet
- **Dashboard color:** YELLOW when at or above 1.0%

### Mastercard ECM (Excessive Chargeback Merchant) — PENALTY TIER
- **Threshold:** 1.5% dispute ratio AND 100+ disputes for 2 consecutive months
- **Consequence:** Severe fines ($25,000–$100,000+/month), potential MATCH/TMF blacklist
- **Dashboard color:** RED when at or above 1.5%

### Visa Enumeration (Card Testing)
- **Threshold:** 20% decline rate
- **Dashboard color:** RED when at or above 20%

### Health Score Calculation
Composite score from 0–100 combining:
- Dispute ratio vs thresholds (heaviest weight)
- Fraud ratio (TC40 reports)
- Refund velocity (sudden spikes)
- Account restriction status (any pending requirements)
- Decline rate (card testing indicator)

Green = 70–100 (safe), Yellow = 40–69 (caution), Red = 0–39 (critical)

---

## Stripe API Endpoints to Use

### REST API (polling — run daily via cron)

```
GET /v1/disputes — Count disputes in rolling 30-day window
GET /v1/charges — Total settled transaction count for ratio denominator
GET /v1/radar/early_fraud_warnings — TC40 fraud report counts for Visa VAMP
```

### Webhooks (real-time event ingestion)

```
charge.dispute.created — New dispute event, update ratio immediately
account.updated — Monitor requirements.currently_due and capabilities changes
charge.failed — Track decline rates for velocity anomaly detection (Phase 2)
radar.early_fraud_warning.created — New fraud warning event
```

### Critical Webhook Implementation Rules

1. **Signature verification:** Always verify webhook signatures using the RAW request body. In Next.js, disable automatic body parsing for the webhook route. Use `stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)`. Parsed JSON WILL cause verification to fail.

2. **Immediate 200 response:** Always return HTTP 200 immediately upon receiving the event. Process alert routing (Slack, SMS, email) asynchronously. If you don't return 200 fast enough, Stripe will retry delivery repeatedly.

3. **Idempotency:** Webhook events can be delivered more than once. Always check if you've already processed an event ID before taking action.

```typescript
// Example webhook handler structure in Next.js
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Return 200 immediately
  res.status(200).json({ received: true });
  
  // Process asynchronously
  await processEvent(event);
}
```

---

## Phased Build Plan

### Phase 1: MVP (Weeks 1–2) — SHIP THIS FIRST

**Features:**
- Real-time compliance dashboard with gauge visualization showing rolling 30-day dispute ratio and fraud ratio
- Visual threshold markers for Visa VAMP (1.5%), Mastercard CMM (1.0% yellow), Mastercard ECM (1.5% red)
- Composite health score (0–100)
- Webhook listener for `account.updated` monitoring `requirements.currently_due` array and `capabilities` changes
- Email alert (via Resend) when Stripe silently flags account for review or requests KYC documents
- Dashboard notification panel showing current restriction status and pending requirements
- Daily data refresh with timestamp

**Pricing:** $29/month (Monitor plan)

**Stripe UI Components to use:**
- `BarChart` or custom gauge for ratio visualization
- `LineChart` or `Sparkline` for mini trend indicators
- `ContextView` for the main app layout
- `List` for restriction status items
- `Badge` for health status indicator
- `Banner` for critical alerts

### Phase 2: Defense Layer (Month 2)

**Features:**
- Velocity & card-testing anomaly detection (baseline normal patterns, alert on deviations)
- 30-day historical trend charts (dispute ratio, fraud ratio, refund rate over time)
- Slack integration (merchant configures incoming webhook URL)
- SMS integration via Twilio (critical alerts only)
- Week-over-week comparison

**Pricing:** $59/month (Defend plan — includes everything in Monitor)

### Phase 3: Premium Tier (Month 3)

**Features:**
- Suggested refund alerts: when early warning signals indicate a likely dispute, alert merchant with one-click refund button (requires OAuth scope upgrade to write refunds)
- Remediation plan generator: auto-generate templates documenting corrective steps (3D Secure enablement, Radar rules, evidence guidance)
- 90-day trend history with CSV exports

**Pricing:** $59/month (included in Defend plan as value expansion)

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Merchants who install ShieldScore
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id TEXT UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'monitor', -- 'monitor' or 'defend'
  slack_webhook_url TEXT,
  phone TEXT, -- for SMS alerts
  alert_preferences JSONB DEFAULT '{"email": true, "slack": false, "sms": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily snapshots of account health metrics
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  date DATE NOT NULL,
  total_charges INTEGER DEFAULT 0,
  total_disputes INTEGER DEFAULT 0,
  total_fraud_warnings INTEGER DEFAULT 0,
  total_refunds INTEGER DEFAULT 0,
  total_declines INTEGER DEFAULT 0,
  dispute_ratio DECIMAL(6,4) DEFAULT 0,
  fraud_ratio DECIMAL(6,4) DEFAULT 0,
  decline_rate DECIMAL(6,4) DEFAULT 0,
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, date)
);

-- Real-time event log for webhook events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL, -- 'dispute.created', 'account.updated', etc.
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  alert_type TEXT NOT NULL, -- 'threshold_warning', 'restriction_detected', 'velocity_spike'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivered_via JSONB DEFAULT '[]', -- ['email', 'slack', 'sms']
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account restrictions tracking
CREATE TABLE restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  restriction_type TEXT NOT NULL, -- 'requirements_due', 'capability_restricted', 'capability_pending'
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

---

## Project Structure

```
shieldscore/
├── stripe-app/                    # Stripe UI Extension (React + TypeScript)
│   ├── src/
│   │   ├── views/
│   │   │   ├── DashboardView.tsx  # Main health score dashboard
│   │   │   ├── AlertsView.tsx     # Alert history and current restrictions
│   │   │   └── SettingsView.tsx   # Alert preferences, Slack webhook config
│   │   ├── components/
│   │   │   ├── HealthGauge.tsx    # Circular/gauge health score visualization
│   │   │   ├── RatioCard.tsx      # Individual metric card (dispute ratio, fraud ratio)
│   │   │   ├── ThresholdBar.tsx   # Progress bar with VAMP/CMM/ECM markers
│   │   │   ├── AlertBanner.tsx    # Critical alert notification
│   │   │   └── TrendChart.tsx     # Historical trend line (Phase 2)
│   │   ├── hooks/
│   │   │   ├── useHealthScore.ts  # Fetch and calculate health score
│   │   │   ├── useAlerts.ts       # Fetch alert history
│   │   │   └── useRestrictions.ts # Fetch current restriction status
│   │   └── utils/
│   │       ├── ratios.ts          # VAMP/CMM/ECM calculation logic
│   │       └── scoring.ts         # Health score algorithm
│   ├── stripe-app.json            # Stripe app manifest
│   └── package.json
├── backend/                       # Next.js API backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/route.ts    # Webhook handler (signature verification)
│   │   │   ├── metrics/
│   │   │   │   └── [merchantId]/route.ts  # GET current metrics for a merchant
│   │   │   ├── alerts/
│   │   │   │   └── [merchantId]/route.ts  # GET/POST alerts
│   │   │   └── cron/
│   │   │       └── daily-sync/route.ts    # Daily metric calculation cron job
│   │   └── page.tsx               # Landing page / marketing site
│   ├── lib/
│   │   ├── stripe.ts              # Stripe client initialization
│   │   ├── supabase.ts            # Supabase client initialization
│   │   ├── calculations.ts        # Ratio and health score calculations
│   │   ├── alerts.ts              # Alert routing (email, Slack, SMS)
│   │   └── resend.ts              # Email sending via Resend
│   └── package.json
└── README.md
```

---

## Ratio Calculation Logic

```typescript
// VAMP Ratio (Visa)
// Formula: (TC40 Fraud Reports + Disputes) / Total Settled Transactions
function calculateVAMPRatio(fraudWarnings: number, disputes: number, totalCharges: number): number {
  if (totalCharges === 0) return 0;
  return (fraudWarnings + disputes) / totalCharges;
}

// Mastercard Dispute Ratio
// Used for both CMM (1.0%) and ECM (1.5%) thresholds
function calculateMCDisputeRatio(disputes: number, totalCharges: number): number {
  if (totalCharges === 0) return 0;
  return disputes / totalCharges;
}

// Decline Rate (for Visa Enumeration / card testing detection)
function calculateDeclineRate(declines: number, totalAttempts: number): number {
  if (totalAttempts === 0) return 0;
  return declines / totalAttempts;
}

// Health Score (0-100)
function calculateHealthScore(
  vampRatio: number,
  mcDisputeRatio: number,
  declineRate: number,
  hasRestrictions: boolean
): number {
  let score = 100;
  
  // VAMP impact (heaviest weight)
  if (vampRatio >= 0.015) score -= 50;        // At or above VAMP threshold
  else if (vampRatio >= 0.01) score -= 30;     // Approaching danger
  else if (vampRatio >= 0.005) score -= 10;    // Elevated
  
  // Mastercard impact
  if (mcDisputeRatio >= 0.015) score -= 30;    // ECM penalty zone
  else if (mcDisputeRatio >= 0.01) score -= 15; // CMM warning zone
  else if (mcDisputeRatio >= 0.005) score -= 5; // Elevated
  
  // Decline rate impact
  if (declineRate >= 0.20) score -= 20;         // Card testing threshold
  else if (declineRate >= 0.10) score -= 10;    // Elevated declines
  
  // Restrictions impact
  if (hasRestrictions) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}
```

---

## Alert Logic

### When to send alerts:

| Condition | Severity | Channel |
|-----------|----------|---------|
| Dispute ratio crosses 0.5% (approaching) | Info | Email |
| Dispute ratio crosses 0.75% (warning) | Warning | Email + Slack |
| Dispute ratio crosses 1.0% (CMM zone) | Warning | Email + Slack + SMS |
| Dispute ratio crosses 1.5% (ECM/VAMP zone) | Critical | Email + Slack + SMS |
| `requirements.currently_due` populated | Critical | Email + Slack + SMS |
| Account capability changed to restricted/pending | Critical | Email + Slack + SMS |
| Decline rate exceeds 15% | Warning | Email + Slack |
| Decline rate exceeds 20% (enumeration threshold) | Critical | Email + Slack + SMS |

### Alert email template structure:
- Subject: "[ShieldScore] ⚠️ Your dispute ratio just hit X.XX% — action needed"
- Body: Current ratio, threshold it's approaching, what to do next, link to Stripe Dashboard
- Keep it short and actionable. No fluff.

---

## Stripe App Manifest (stripe-app.json)

```json
{
  "id": "com.shieldscore.app",
  "version": "1.0.0",
  "name": "ShieldScore",
  "icon": "./icon.png",
  "permissions": [
    {
      "permission": "account_read",
      "purpose": "Monitor account health, restrictions, and capability status"
    },
    {
      "permission": "charge_read",
      "purpose": "Calculate transaction volume for compliance ratio tracking"
    },
    {
      "permission": "dispute_read",
      "purpose": "Track disputes for VAMP and ECM threshold monitoring"
    },
    {
      "permission": "early_fraud_warning_read",
      "purpose": "Monitor TC40 fraud reports for Visa VAMP ratio calculation"
    }
  ],
  "app_backend": {
    "url": "https://shieldscore.com/api"
  },
  "ui_extension": {
    "views": [
      {
        "viewport": "stripe.dashboard.home.overview",
        "component": "DashboardView"
      },
      {
        "viewport": "stripe.dashboard.payment.detail",
        "component": "PaymentDetailView"
      }
    ]
  }
}
```

---

## Design Principles

1. **Trust first.** Every UI element should reinforce that ShieldScore is read-only and safe. Show the "read-only" badge prominently.
2. **Urgency without panic.** Use clear color coding (green/yellow/red) but don't create false alarms. Only alert when thresholds are genuinely approaching.
3. **Native feel.** Use Stripe's UI Extension SDK components so the app feels like a built-in Stripe feature, not a third-party bolt-on.
4. **Immediate value.** The moment a merchant installs, they should see their health score and current ratios within seconds. No onboarding wizard, no 10-step setup.
5. **Data accuracy over speed.** A wrong ratio is worse than a slow ratio. Double-check all calculations. Use the exact formulas specified in this document.

---

## What NOT to Build

- Do NOT build a separate web app with its own login. Everything lives inside Stripe Dashboard.
- Do NOT build custom auth. Stripe OAuth handles this.
- Do NOT build a custom database layer. Use Supabase.
- Do NOT build automated refund logic in the MVP. Read-only only.
- Do NOT add features not listed in the current phase. Ship the MVP first.
- Do NOT use AI/ML for the MVP health score. Use deterministic threshold-based calculations. ML can come later when you have data from hundreds of merchants.
- Do NOT build features that overlap with Stripe's native Health Alerts system (see below).

---

## Stripe Native Health Alerts — DO NOT OVERLAP

Stripe has a built-in "Health Alerts" feature. ShieldScore must NOT duplicate any of its functionality. Understand the boundary clearly:

**What Stripe Health Alerts already covers (DO NOT BUILD):**
- API error monitoring (402, 500, 400, 409, 429 status codes)
- API latency monitoring
- Payment method decline anomalies (card authorization decline rates)
- Webhook latency alerts
- Issuing request timeouts
- Integration error tracking
- Payment volume decline detection (ML-based, private preview)

**What ShieldScore covers (OUR TERRITORY — Stripe does NOT do this):**
- Dispute ratio tracking against VAMP (1.5%) and CMM/ECM (1.0%/1.5%) card network thresholds
- TC40 fraud report ratio tracking for Visa VAMP calculation
- `requirements.currently_due` monitoring (silent KYC/compliance flags)
- Account capability status changes (active → restricted → pending)
- Composite account health score based on compliance risk
- Velocity anomaly detection specifically for card-testing bot patterns
- Remediation plan generation for threshold breaches
- Suggested refund alerts for high-risk payments

**The key distinction:** Stripe Health Alerts = "Is your API integration working?" ShieldScore = "Is Stripe about to freeze your account?" These are completely different problems. A merchant can have perfect API health and still get frozen because their dispute ratio is too high. ShieldScore monitors the compliance and underwriting risk that Stripe's Health Alerts intentionally do not expose.

---

## Definition of Done — MVP

The MVP is "done" and ready for Stripe App Marketplace submission when:

- [ ] Stripe App renders inside the test Stripe Dashboard
- [ ] OAuth flow works: merchant installs app, grants read-only permissions
- [ ] Disputes API data is pulled and dispute ratio is calculated correctly
- [ ] Early Fraud Warnings API data is pulled and VAMP ratio is calculated correctly  
- [ ] Health score (0–100) displays with correct color coding
- [ ] VAMP gauge shows current ratio vs 1.5% threshold
- [ ] Mastercard gauge shows current ratio vs 1.0% (CMM) and 1.5% (ECM) thresholds
- [ ] `account.updated` webhook listener is processing events
- [ ] Email alert fires when `requirements.currently_due` populates
- [ ] Email alert fires when dispute ratio crosses 0.75%
- [ ] Landing page is deployed at shieldscore.com with waitlist signup
- [ ] App is submitted to Stripe App Marketplace for review

---

## Commands Reference

```bash
# Create the Stripe App
stripe apps create shieldscore

# Start dev server for the Stripe UI Extension
stripe apps start

# Upload the app for review
stripe apps upload

# Listen for webhooks locally during development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test webhook events
stripe trigger charge.dispute.created
stripe trigger account.updated
```

---

## Important Context

- This app targets the Stripe App Marketplace (495 apps currently, only 2 competitors in account health monitoring)
- Stripe takes 0% commission on app revenue until $1M lifetime
- The target customer is SaaS founders and ecommerce merchants processing $10K–$500K/month
- The pricing is $29/month (Monitor) and $59/month (Defend)
- The long-term vision is acquisition by Stripe (becoming "Stripe Shield"), following the pattern of TaxJar → Stripe Tax, Lemon Squeezy → Stripe Managed Payments
- But the immediate goal is building a real business with real revenue. Don't optimize for acquisition. Optimize for customer value.

---

## How You Should Behave (Claude Code Instructions)

You are a senior full-stack engineer working as the technical co-founder on ShieldScore. Act like it. This means:

### Code Quality
- Write production-grade code from the start. No "TODO: fix later" hacks. If something needs to be done right, do it right the first time.
- Use TypeScript strictly. No `any` types. No ignoring type errors. Strong typing everywhere.
- Write clean, readable code with clear variable names. No single-letter variables except in loops.
- Keep functions small and focused. If a function does more than one thing, split it.
- Handle errors properly. Never swallow errors silently. Log them, alert on them, handle them.
- Write code that a new engineer could read and understand without explanation.

### Architecture Decisions
- If I propose something that's architecturally wrong, tell me directly. Don't just do what I say if it's a bad idea. Explain why it's bad and suggest the better approach.
- If there's a more efficient, cleaner, or more secure way to do something, say so before writing code.
- Always consider edge cases: what happens when the API returns empty data? What happens when a webhook fires twice? What happens when the database is unreachable?
- Think about scale from the start. Will this approach work with 10 merchants? 100? 1,000? 10,000?

### Push Back When Needed
- If I ask you to add a feature that isn't in the current phase, push back. Remind me of the phased plan and tell me to ship the MVP first.
- If I want to over-engineer something, call it out. Tell me the simpler approach.
- If I want to skip something important (like error handling, input validation, or security), refuse. Explain why it matters.
- If my code has a bug or a bad pattern, point it out immediately. Don't wait for me to find it.

### Communication Style
- Be direct and blunt. No filler language. Say "this is wrong because X" not "you might want to consider perhaps looking at..."
- When explaining a technical decision, keep it short. One or two sentences, not a paragraph.
- If I ask a question, answer it directly first, then explain if needed.
- Use code examples over long explanations whenever possible.

### Security & Stripe-Specific Rules
- NEVER store raw API keys in code or environment variables that get committed. Use `.env.local` and verify `.gitignore` includes it.
- ALWAYS verify webhook signatures. If you see a webhook handler without signature verification, flag it immediately.
- ALWAYS return 200 from webhook handlers immediately, then process async. No exceptions.
- NEVER request write scopes in the MVP. Read-only OAuth only.
- ALWAYS check for idempotency on webhook events. Stripe can send the same event multiple times.
- NEVER log or store full card numbers, CVVs, or other PCI-sensitive data. We don't touch cardholder data, period.

### Git & Workflow
- Write clear, descriptive commit messages. Not "fix stuff" — write "fix: webhook signature verification failing on raw body parsing in Next.js route handler"
- Commit frequently. Small, focused commits. One logical change per commit.
- Before making changes to an existing file, explain what you're changing and why.

### When In Doubt
- Refer back to this CLAUDE.md for the source of truth on architecture, features, and thresholds.
- If something contradicts this document, this document wins.
- If you're unsure about a Stripe API behavior, say so. Don't guess. Suggest we check the Stripe docs.

### Design & UI
- The landing page and marketing site uses: white background, DM Sans font, text color #111111, minimal color palette (black, white, grays only — color only inside dashboard/product UI for green/yellow/red indicators)
- The Stripe App UI Extension uses Stripe's native SDK components — follow their design language exactly
- Everything should look clean enough that Stripe's team would be impressed if they saw it
