-- Migration: Bi-directional sync between users.wallet_balance and wallets.availableBalance
-- Created: 2026-04-20

-- 1. Create or update the trigger function for users -> wallets
CREATE OR REPLACE FUNCTION sync_users_to_wallets_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    UPDATE wallets 
    SET "availableBalance" = NEW.wallet_balance, "updatedAt" = NOW()
    WHERE "userId" = NEW.id::text;
    
    IF NOT FOUND THEN
      INSERT INTO wallets ("id", "userId", "currency", "status", "availableBalance", "pendingBalance", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, NEW.id::text, 'GHS', 'ACTIVE', NEW.wallet_balance, 0, NOW(), NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_users_to_wallets ON users;
CREATE TRIGGER trg_sync_users_to_wallets
AFTER UPDATE OF wallet_balance ON users
FOR EACH ROW
WHEN (pg_trigger_depth() = 0)
EXECUTE FUNCTION sync_users_to_wallets_fn();

-- 2. Create or update the trigger function for wallets -> users
CREATE OR REPLACE FUNCTION sync_wallets_to_users_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."availableBalance" IS DISTINCT FROM OLD."availableBalance" THEN
    UPDATE users 
    SET wallet_balance = NEW."availableBalance", updated_at = NOW()
    WHERE id::text = NEW."userId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_wallets_to_users ON wallets;
CREATE TRIGGER trg_sync_wallets_to_users
AFTER UPDATE OF "availableBalance" ON wallets
FOR EACH ROW
WHEN (pg_trigger_depth() = 0)
EXECUTE FUNCTION sync_wallets_to_users_fn();

-- 3. Perform a one-time sync for existing records (users -> wallets is source of truth)
UPDATE wallets w
SET "availableBalance" = u.wallet_balance
FROM users u
WHERE w."userId" = u.id::text AND w."availableBalance" IS DISTINCT FROM u.wallet_balance;

INSERT INTO wallets ("id", "userId", "currency", "status", "availableBalance", "pendingBalance", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id::text, 'GHS', 'ACTIVE', COALESCE(wallet_balance, 0), 0, NOW(), NOW()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w."userId" = u.id::text);
