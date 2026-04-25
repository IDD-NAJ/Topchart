-- Add missing referral-related columns to users table
-- Required for account registration functionality

ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_deposits DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
