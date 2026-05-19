-- Add stock and pricing columns to data_bundles table
-- Migration for data bundles pricing management

-- Add stock column for availability tracking
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS stock INTEGER;

-- Add pricing override column
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "priceOverride" DECIMAL(10, 2);

-- Add markup percentage column
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "markupPercent" DECIMAL(5, 2);

-- Add featured flag column
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT FALSE;

-- Add networkId UUID column for proper network relationship
ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "networkId" UUID REFERENCES networks(id) ON DELETE SET NULL;

-- Create index for stock filtering
CREATE INDEX IF NOT EXISTS idx_data_bundles_stock ON data_bundles(stock);

-- Create index for featured filtering
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_featured ON data_bundles("isFeatured");

-- Create index for price override filtering
CREATE INDEX IF NOT EXISTS idx_data_bundles_price_override ON data_bundles("priceOverride");
