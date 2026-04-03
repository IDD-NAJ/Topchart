-- Add role-based access control (RBAC) to users

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Optional index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

