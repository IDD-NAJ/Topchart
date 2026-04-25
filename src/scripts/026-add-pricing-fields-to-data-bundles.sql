-- Add pricing and admin control fields to data_bundles table
ALTER TABLE data_bundles
ADD COLUMN IF NOT EXISTS price_override DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_data_bundles_network_active_featured 
ON data_bundles(network_id, is_active, is_featured);

-- Add index for pricing lookups
CREATE INDEX IF NOT EXISTS idx_data_bundles_datamart_plan_id_active 
ON data_bundles(datamart_plan_id, is_active);

-- Add comment explaining the pricing logic
COMMENT ON COLUMN data_bundles.price_override IS 'Manual price override - takes precedence over markup_percent';
COMMENT ON COLUMN data_bundles.markup_percent IS 'Percentage markup applied to original provider price (e.g., 10.00 for 10%)';
COMMENT ON COLUMN data_bundles.is_featured IS 'Whether to highlight this plan in the UI';
COMMENT ON COLUMN data_bundles.notes IS 'Admin notes about this plan';
