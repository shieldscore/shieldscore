-- Migration 007: add mode column to daily_metrics
--
-- Stripe Apps install separately in test vs live mode, but both use the same
-- stripe_account_id. Without a mode discriminator, a test-mode sync overwrites
-- the live-mode snapshot (and vice versa) for merchants that use both modes.
--
-- Changes:
--   1. Add mode column to daily_metrics (default 'live' for backfill safety).
--   2. Drop the old (merchant_id, date) unique constraint.
--   3. Add a new unique constraint on (merchant_id, date, mode).

ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'live'
  CHECK (mode IN ('test', 'live'));

-- Drop the old unique constraint. Supabase/Postgres names this after the table.
ALTER TABLE daily_metrics
  DROP CONSTRAINT IF EXISTS daily_metrics_merchant_id_date_key;

-- Add the new unique constraint scoped by mode.
ALTER TABLE daily_metrics
  ADD CONSTRAINT daily_metrics_merchant_id_date_mode_key
  UNIQUE (merchant_id, date, mode);

-- Optional: index for fast "latest snapshot for this mode" lookups.
CREATE INDEX IF NOT EXISTS idx_daily_metrics_merchant_mode_date
  ON daily_metrics (merchant_id, mode, date DESC);
