-- Ensure wallets.updated_at never violates NOT NULL

ALTER TABLE wallets
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

UPDATE wallets
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

