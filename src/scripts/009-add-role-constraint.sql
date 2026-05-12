-- Enforce allowed role values for RBAC integrity.
-- Run after 008-add-user-role.sql.

-- Add CHECK constraint (ignore if names differ; adjust as needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_users_role' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (UPPER(role) IN ('USER', 'ADMIN', 'RESELLER'));
  END IF;
END $$;
