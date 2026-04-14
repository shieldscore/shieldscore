-- Migration: Update merchants table for 3-tier pricing (free, pro, defend)
--
-- Changes:
--   - Update plan column default from 'monitor' to 'free'
--   - Migrate existing 'monitor' plans to 'free'
--   - Add plan_updated_at column
--   - Add CHECK constraint for valid plan values

-- Migrate existing plan values
UPDATE merchants SET plan = 'free' WHERE plan = 'monitor';
UPDATE merchants SET plan = 'pro' WHERE plan NOT IN ('free', 'pro', 'defend');

-- Change the default for new merchants
ALTER TABLE merchants ALTER COLUMN plan SET DEFAULT 'free';

-- Add plan_updated_at column
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add a CHECK constraint so only valid plan values are accepted
ALTER TABLE merchants ADD CONSTRAINT chk_plan_valid CHECK (plan IN ('free', 'pro', 'defend'));
