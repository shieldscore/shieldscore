-- ShieldScore Initial Schema
-- Run this in Supabase SQL Editor

-- Merchants who install ShieldScore
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id TEXT UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'monitor' CHECK (plan IN ('monitor', 'defend')),
  slack_webhook_url TEXT,
  phone TEXT,
  alert_preferences JSONB DEFAULT '{"email": true, "slack": false, "sms": false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily snapshots of account health metrics
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
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
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_warning', 'restriction_detected', 'velocity_spike')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivered_via JSONB DEFAULT '[]',
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account restrictions tracking
CREATE TABLE restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('requirements_due', 'capability_restricted', 'capability_pending')),
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_daily_metrics_merchant_date ON daily_metrics(merchant_id, date DESC);
CREATE INDEX idx_events_merchant_type ON events(merchant_id, event_type);
CREATE INDEX idx_events_stripe_id ON events(stripe_event_id);
CREATE INDEX idx_alerts_merchant_severity ON alerts(merchant_id, severity, created_at DESC);
CREATE INDEX idx_restrictions_merchant_active ON restrictions(merchant_id, resolved);

-- Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;

-- Service role policies (backend uses service role key)
CREATE POLICY "Service role full access" ON merchants FOR ALL USING (true);
CREATE POLICY "Service role full access" ON daily_metrics FOR ALL USING (true);
CREATE POLICY "Service role full access" ON events FOR ALL USING (true);
CREATE POLICY "Service role full access" ON alerts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON restrictions FOR ALL USING (true);
