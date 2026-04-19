-- Add composite index on auth_sessions for faster session lookups
-- This index covers the common query pattern: WHERE token = ? AND expires_at > NOW()
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_expires_at 
ON auth_sessions(token, expires_at) 
WHERE expires_at > NOW();
