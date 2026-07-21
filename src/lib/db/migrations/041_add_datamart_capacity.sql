-- Migration: Add datamart_capacity column to track original capacity from datamart API
-- This allows us to upsert bundles based on their datamart identifier

ALTER TABLE data_bundles 
ADD COLUMN IF NOT EXISTS "datamart_capacity" VARCHAR;

-- Create unique index for upserts (network_id + datamart_capacity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_bundles_network_datamart_capacity 
ON data_bundles(network_id, "datamart_capacity") 
WHERE "datamart_capacity" IS NOT NULL;
