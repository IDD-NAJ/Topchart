-- Normalize all existing emails to lowercase
-- This ensures case-insensitive email handling for existing users

UPDATE users 
SET email = LOWER(email), updated_at = NOW()
WHERE email != LOWER(email);

-- Add a check constraint to ensure future emails are stored in lowercase
ALTER TABLE users 
ADD CONSTRAINT check_email_lowercase 
CHECK (email = LOWER(email));

COMMENT ON TABLE users IS 'Users table with case-insensitive email handling';
COMMENT ON COLUMN users.email IS 'User email address - always stored in lowercase for case-insensitive authentication';
