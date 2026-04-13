-- Performance indexes for ShieldScore at scale
--
-- The initial schema (001) created:
--   idx_daily_metrics_merchant_date ON daily_metrics(merchant_id, date DESC)
--   idx_events_merchant_type ON events(merchant_id, event_type)
--   idx_events_stripe_id ON events(stripe_event_id)
--   idx_alerts_merchant_severity ON alerts(merchant_id, severity, created_at DESC)
--   idx_restrictions_merchant_active ON restrictions(merchant_id, resolved)
--
-- This migration adds additional indexes identified during the scalability audit.

-- Merchants: fast lookup by Stripe account ID (used in every API route)
-- The UNIQUE constraint on stripe_account_id already creates an index,
-- but we add this explicitly for clarity and to ensure it exists.
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_account
  ON merchants(stripe_account_id);

-- Alerts: merchant + created_at for the 24-hour deduplication query in alerts.ts
-- and for the alerts API endpoint (ORDER BY created_at DESC).
CREATE INDEX IF NOT EXISTS idx_alerts_merchant_created
  ON alerts(merchant_id, created_at DESC);

-- Alerts: merchant + alert_type + created_at for deduplication lookups
-- (WHERE merchant_id = $1 AND alert_type = $2 AND created_at > $3)
CREATE INDEX IF NOT EXISTS idx_alerts_dedup
  ON alerts(merchant_id, alert_type, created_at DESC);

-- Daily metrics: covering index for date-range queries with merchant filter.
-- Used by weekly-comparison, trend calculations, export, and history endpoints.
CREATE INDEX IF NOT EXISTS idx_daily_metrics_merchant_date_range
  ON daily_metrics(merchant_id, date DESC);

-- Events: merchant + event_type + created_at for the disputes endpoint
-- (WHERE merchant_id = $1 AND event_type = 'charge.dispute.created' ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_events_merchant_type_created
  ON events(merchant_id, event_type, created_at DESC);

-- Restrictions: merchant + resolved + restriction_type for the webhook handler
-- (WHERE merchant_id = $1 AND restriction_type = $2 AND resolved = false)
CREATE INDEX IF NOT EXISTS idx_restrictions_merchant_type_active
  ON restrictions(merchant_id, restriction_type, resolved);
