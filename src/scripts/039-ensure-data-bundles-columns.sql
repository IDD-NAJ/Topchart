-- Migration 039: Ensure all required data_bundles columns exist (camelCase + snake_case)
-- Ensures the admin data-bundles-pricing API works correctly

-- Add isActive (camelCase) if missing, seeded from snake_case is_active
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;
UPDATE data_bundles SET "isActive" = is_active WHERE "isActive" IS NULL AND is_active IS NOT NULL;

-- Add isPopular (camelCase) if missing
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN DEFAULT FALSE;
UPDATE data_bundles SET "isPopular" = is_popular WHERE "isPopular" IS NULL AND is_popular IS NOT NULL;

-- Add sizeMb (camelCase) if missing
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "sizeMb" VARCHAR(50);
UPDATE data_bundles SET "sizeMb" = size_mb WHERE "sizeMb" IS NULL AND size_mb IS NOT NULL;

-- Add validityHours (camelCase) if missing
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "validityHours" INTEGER;
UPDATE data_bundles SET "validityHours" = validity_hours WHERE "validityHours" IS NULL AND validity_hours IS NOT NULL;

-- Add updatedAt (camelCase) if missing
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
UPDATE data_bundles SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL;

-- Add priceOverride if not already there (from add-stock-column-data-bundles.sql)
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "priceOverride" DECIMAL(10, 2);

-- Add markupPercent if not already there
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "markupPercent" DECIMAL(5, 2);

-- Add isFeatured if not already there
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT FALSE;

-- Add networkId UUID FK if not already there
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "networkId" UUID REFERENCES networks(id) ON DELETE SET NULL;

-- Add stock column
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Sync networkId from network name for existing records
UPDATE data_bundles b
SET "networkId" = n.id
FROM networks n
WHERE (
    LOWER(b.network) = LOWER(n.name)
    OR LOWER(b.network) = LOWER(n.code)
    OR (LOWER(b.network) = 'mtn' AND LOWER(n.code) = 'mtn')
    OR (LOWER(b.network) IN ('vodafone', 'telecel') AND LOWER(n.code) = 'vodafone')
    OR (LOWER(b.network) IN ('airteltigo', 'at') AND LOWER(n.code) = 'airteltigo')
)
AND b."networkId" IS NULL;

-- Create indexes for camelCase columns
CREATE INDEX IF NOT EXISTS idx_data_bundles_network_id_uuid ON data_bundles("networkId");
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_active_camel ON data_bundles("isActive");
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_popular_camel ON data_bundles("isPopular");

-- Add verification_pricing_settings config key if missing
INSERT INTO system_config (config_key, config_value, updated_at)
VALUES (
    'verification_pricing_settings',
    '{"exchangeRate": 15.5, "defaultMarkup": 40, "minMarkup": null, "maxMarkup": null, "categoryDefaults": {"social_media": 40, "ecommerce_financial": 40, "professional_tools": 40, "streaming_entertainment": 40}, "pvadealsApiKey": ""}'::jsonb,
    NOW()
)
ON CONFLICT (config_key) DO NOTHING;

-- Add datamart_api_key config key if missing
INSERT INTO system_config (config_key, config_value, updated_at)
VALUES (
    'datamart_settings',
    '{"apiKey": "", "baseUrl": "https://api.datamartgh.shop", "webhookUrl": "", "syncEnabled": false}'::jsonb,
    NOW()
)
ON CONFLICT (config_key) DO NOTHING;
