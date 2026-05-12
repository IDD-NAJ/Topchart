-- ============================================================
-- 002_notifications_schema_fixes.sql
-- Adds the notifications table and fixes missing/misnamed
-- columns in verification_sms and verification_numbers.
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- notifications: user inbox items
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================================
-- verification_numbers: add missing columns
-- ============================================================
ALTER TABLE verification_numbers
  ADD COLUMN IF NOT EXISTS pvadeals_request_id TEXT,
  ADD COLUMN IF NOT EXISTS allow_flag          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_reuse         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ============================================================
-- verification_sms: fix column names and add missing columns
-- ============================================================

-- Rename from_num → from_number if the old name exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_sms' AND column_name = 'from_num'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verification_sms' AND column_name = 'from_number'
  ) THEN
    ALTER TABLE verification_sms RENAME COLUMN from_num TO from_number;
  END IF;
END $$;

-- Add from_number if neither old nor new name exists (fresh install)
ALTER TABLE verification_sms
  ADD COLUMN IF NOT EXISTS from_number     TEXT NOT NULL DEFAULT 'Unknown';

-- Add pvadeals_sms_id (used for ON CONFLICT dedup in upsertPvadealsSmsRows)
ALTER TABLE verification_sms
  ADD COLUMN IF NOT EXISTS pvadeals_sms_id TEXT UNIQUE;

-- Add is_read (queried in SELECT and updated to true on read)
ALTER TABLE verification_sms
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
