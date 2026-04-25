-- Ensure transactions table has user_id column to match application code

-- Add user_id column if it's missing
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint to users table, if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'transactions'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_transactions_user_id_users'
  ) THEN
    ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_user_id_users
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END
$$;

