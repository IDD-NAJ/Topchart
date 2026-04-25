-- Fix data_bundle_categories table: add missing columns
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS network VARCHAR(50);
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE data_bundle_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix data_bundles table: add missing columns
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS category_id VARCHAR(255);
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS size_mb INTEGER;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS validity_hours INTEGER DEFAULT 2160;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS price_override NUMERIC(10,2);
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS markup_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Seed categories if they don't exist
INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_mtn', 'MTN', 'MTN Data Bundles', 1, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();

INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_vodafone', 'VODAFONE', 'Vodafone Data Bundles', 2, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();

INSERT INTO data_bundle_categories (id, network, name, sort_order, is_active, updated_at)
VALUES ('cat_airteltigo', 'AIRTELTIGO', 'AirtelTigo Data Bundles', 3, TRUE, NOW())
ON CONFLICT (id) DO UPDATE SET network = EXCLUDED.network, name = EXCLUDED.name, updated_at = NOW();
