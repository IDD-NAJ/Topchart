-- PVADeals Migration: Replace TextVerified with PVADeals
-- Run this after 015-add-verification-tables.sql

-- ─── verification_services ───────────────────────────────────────────────────

ALTER TABLE verification_services
  RENAME COLUMN textverified_service_id TO pvadeals_service_id;

ALTER TABLE verification_services
  ADD COLUMN IF NOT EXISTS picture_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS str_price DECIMAL(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltr3_price DECIMAL(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltr7_price DECIMAL(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltr14_price DECIMAL(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltr30_price DECIMAL(10, 4) DEFAULT 0;

-- ─── verification_numbers ────────────────────────────────────────────────────

ALTER TABLE verification_numbers
  RENAME COLUMN textverified_order_id TO pvadeals_request_id;

ALTER TABLE verification_numbers
  DROP COLUMN IF EXISTS textverified_target_id;

ALTER TABLE verification_numbers
  ADD COLUMN IF NOT EXISTS ltr_duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS allow_flag BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_reuse BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;

-- Update type constraint to STR / LTR
ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_type_check;
ALTER TABLE verification_numbers
  ADD CONSTRAINT verification_numbers_type_check
  CHECK (type IN ('STR', 'LTR', 'onetime', 'rental'));

-- ─── verification_sms ────────────────────────────────────────────────────────

ALTER TABLE verification_sms
  RENAME COLUMN textverified_sms_id TO pvadeals_sms_id;

-- ─── transactions type constraint ────────────────────────────────────────────

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN (
    'deposit', 'airtime', 'data',
    'verification_onetime', 'verification_rental', 'verification_extension',
    'verification_STR', 'verification_LTR',
    'reseller_application', 'result_checker'
  ));

-- ─── Clear old sample data (seeded for TextVerified) ─────────────────────────
-- Services will be re-seeded via the admin sync endpoint from PVADeals live data
TRUNCATE verification_services CASCADE;

-- ─── Updated indexes ─────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_verification_services_textverified;
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_services_pvadeals_id
  ON verification_services(pvadeals_service_id);

CREATE INDEX IF NOT EXISTS idx_verification_numbers_pvadeals_request
  ON verification_numbers(pvadeals_request_id);
