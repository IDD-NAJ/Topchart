-- Composite index for favorites query pattern: WHERE user_id = ? AND type IN (?, 'general')
-- Replaces separate idx_favorites_user_id and idx_favorites_type indexes for this query pattern
CREATE INDEX IF NOT EXISTS idx_favorites_user_id_type ON favorites(user_id, type);

-- Composite index for transaction duplicate check: WHERE user_id = ? AND metadata->>'idempotency_key' = ?
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_idempotency ON transactions(user_id, (metadata->>'idempotency_key'));
