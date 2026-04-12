-- Add MCC (Merchant Category Code) column to merchants table
-- Defaults to '5999' (E-commerce General) until the merchant's actual MCC is known
ALTER TABLE merchants ADD COLUMN mcc_code TEXT DEFAULT '5999';
