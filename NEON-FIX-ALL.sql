-- Run this in Neon SQL Editor with the OWNER role (not authenticator)
-- Fixes ALL permission and schema issues

-- 1. Grant schema usage and ALL on every public table
GRANT USAGE ON SCHEMA public TO authenticator;
DO $$
DECLARE tbl RECORD;
BEGIN
    FOR tbl IN SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT ALL ON TABLE %I.%I TO authenticator', tbl.table_schema, tbl.table_name);
    END LOOP;
END $$;

-- 2. Fix transactions.user_id type (UUID -> TEXT to match users.id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
        ALTER TABLE transactions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
        ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix verification_numbers.user_id type (UUID -> TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_numbers' AND column_name = 'user_id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_user_id_fkey;
        ALTER TABLE verification_numbers ALTER COLUMN user_id TYPE TEXT USING user_id::text;
        ALTER TABLE verification_numbers ADD CONSTRAINT verification_numbers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Fix verification_numbers.service_id type (UUID -> TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_numbers' AND column_name = 'service_id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_service_id_fkey;
        ALTER TABLE verification_numbers ALTER COLUMN service_id TYPE TEXT USING service_id::text;
        ALTER TABLE verification_numbers ADD CONSTRAINT verification_numbers_service_id_fkey FOREIGN KEY (service_id) REFERENCES verification_services(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Rename textverified columns to pvadeals if not yet renamed
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_services' AND column_name = 'textverified_service_id') THEN
        ALTER TABLE verification_services RENAME COLUMN textverified_service_id TO pvadeals_service_id;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_numbers' AND column_name = 'textverified_order_id') THEN
        ALTER TABLE verification_numbers RENAME COLUMN textverified_order_id TO pvadeals_request_id;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_sms' AND column_name = 'textverified_sms_id') THEN
        ALTER TABLE verification_sms RENAME COLUMN textverified_sms_id TO pvadeals_sms_id;
    END IF;
END $$;

-- 6. Add missing columns to verification_services
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS pvadeals_service_id VARCHAR(100);
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS picture_url VARCHAR(500);
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'US';
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS str_price DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr3_price DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr7_price DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr14_price DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr30_price DECIMAL(10, 4) DEFAULT 0;
ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5, 2) DEFAULT 30.00;

-- 7. Add missing columns to verification_numbers
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS pvadeals_request_id VARCHAR(100);
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS rental_duration_hours INTEGER DEFAULT 0;
ALTER TABLE verification_numbers DROP COLUMN IF EXISTS textverified_target_id;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS ltr_duration_days INTEGER;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_flag BOOLEAN DEFAULT TRUE;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_reuse BOOLEAN DEFAULT FALSE;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7b. Fix verification_numbers.id type (UUID -> TEXT for uuidv4 string ids)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_numbers' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_pkey;
        ALTER TABLE verification_numbers ALTER COLUMN id TYPE TEXT USING id::text;
        ALTER TABLE verification_numbers ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 7c. Fix verification_services.id type (UUID -> TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_services' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_services DROP CONSTRAINT IF EXISTS verification_services_pkey;
        ALTER TABLE verification_services ALTER COLUMN id TYPE TEXT USING id::text;
        ALTER TABLE verification_services ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 7d. Fix verification_sms columns
ALTER TABLE verification_sms ADD COLUMN IF NOT EXISTS pvadeals_sms_id VARCHAR(100);
ALTER TABLE verification_sms ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- 7e. Fix verification_sms.id and number_id types (UUID -> TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_sms' AND column_name = 'id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_sms DROP CONSTRAINT IF EXISTS verification_sms_pkey;
        ALTER TABLE verification_sms ALTER COLUMN id TYPE TEXT USING id::text;
        ALTER TABLE verification_sms ADD PRIMARY KEY (id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_sms' AND column_name = 'number_id' AND data_type = 'uuid') THEN
        ALTER TABLE verification_sms DROP CONSTRAINT IF EXISTS verification_sms_number_id_fkey;
        ALTER TABLE verification_sms ALTER COLUMN number_id TYPE TEXT USING number_id::text;
        ALTER TABLE verification_sms ADD CONSTRAINT verification_sms_number_id_fkey FOREIGN KEY (number_id) REFERENCES verification_numbers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7f. Fix transactions.verification_number_id type (UUID -> TEXT)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'verification_number_id' AND data_type = 'uuid') THEN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_verification_number_id_fkey;
        ALTER TABLE transactions ALTER COLUMN verification_number_id TYPE TEXT USING verification_number_id::text;
    END IF;
END $$;

-- 7g. Add missing transactions columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verification_number_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'GHS';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fees DECIMAL(12,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. Drop restrictive type/status constraints that block STR/LTR
ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_type_check;
ALTER TABLE verification_numbers DROP CONSTRAINT IF EXISTS verification_numbers_status_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 9. Fix data_bundle_categories
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS network VARCHAR(50);
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Fix data_bundles
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS category_id VARCHAR(255);
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS size_mb INTEGER;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS validity_hours INTEGER DEFAULT 2160;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 11. Seed categories
INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_mtn', 'MTN', 'MTN Data Bundles', 1, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();
INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_vodafone', 'VODAFONE', 'Vodafone Data Bundles', 2, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();
INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_airteltigo', 'AIRTELTIGO', 'AirtelTigo Data Bundles', 3, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();

-- 12. Create missing indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_services_pvadeals_id ON verification_services(pvadeals_service_id);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_pvadeals_request ON verification_numbers(pvadeals_request_id);

-- 13. Service status scheduling + audit safeguards
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS maintenance_starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS maintenance_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS maintenance_auto_resume BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS service_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_status_id UUID REFERENCES service_status(id) ON DELETE CASCADE,
  service_key VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_status_maintenance_window ON service_status(maintenance_starts_at, maintenance_ends_at);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_service_key ON service_status_audit(service_key, changed_at DESC);
