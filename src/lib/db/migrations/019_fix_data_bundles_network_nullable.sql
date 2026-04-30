-- Fix: Make networkId and network columns nullable in data_bundles
-- The table has both network_id (VARCHAR) and networkId (UUID FK) columns.
-- The sync code now fills both, but making them nullable prevents constraint
-- violations if only one is populated by other code paths.

ALTER TABLE data_bundles ALTER COLUMN "networkId" DROP NOT NULL;
ALTER TABLE data_bundles ALTER COLUMN network DROP NOT NULL;
ALTER TABLE data_bundles ALTER COLUMN network_id DROP NOT NULL;

-- Backfill: set networkId from network_id where networkId is still null
-- This uses the networks table to resolve the UUID from the code name
UPDATE data_bundles b
SET "networkId" = n.id
FROM networks n
WHERE b."networkId" IS NULL
  AND COALESCE(b.network_id, b.network) = n.name;

-- Backfill: set network code where null
UPDATE data_bundles
SET network = network_id
WHERE network IS NULL AND network_id IS NOT NULL;
