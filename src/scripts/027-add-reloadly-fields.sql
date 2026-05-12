-- Add Reloadly provider tracking fields to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(50) DEFAULT 'datamart',
ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_fee DECIMAL(10, 2);

-- Add comment explaining the fields
COMMENT ON COLUMN transactions.provider_name IS 'Which provider processed the transaction (datamart, reloadly, etc.)';
COMMENT ON COLUMN transactions.provider_transaction_id IS 'The transaction ID from the provider (e.g., Reloadly transaction ID)';
COMMENT ON COLUMN transactions.provider_fee IS 'Fee charged by the provider (for margin analysis)';

-- Create index for provider tracking queries
CREATE INDEX IF NOT EXISTS idx_transactions_provider 
ON transactions(provider_name, created_at);

-- Create index for provider transaction ID lookups
CREATE INDEX IF NOT EXISTS idx_transactions_provider_tx_id 
ON transactions(provider_transaction_id);

-- Update existing transactions to set provider_name from metadata
-- This is a one-time migration for existing data
UPDATE transactions
SET provider_name = COALESCE(
  metadata->>'provider',
  CASE 
    WHEN type = 'DATA' THEN 'datamart'
    WHEN type = 'AIRTIME' THEN 'datamart'
    ELSE 'unknown'
  END
)
WHERE provider_name IS NULL OR provider_name = 'datamart';
