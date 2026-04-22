-- Migration: Add missing columns to referrals table for growth incentives
-- Created: 2026-04-22

-- Add missing columns to referrals table
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename referred_user_id to referred_id for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referred_id'
    ) THEN
        ALTER TABLE referrals RENAME COLUMN referred_user_id TO referred_id;
    END IF;
END $$;

-- Add foreign key constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'referrals' AND constraint_name = 'referrals_referred_id_fkey'
    ) THEN
        ALTER TABLE referrals 
        ADD CONSTRAINT referrals_referred_id_fkey 
        FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'referrals' AND constraint_name = 'referrals_referrer_id_referred_id_key'
    ) THEN
        ALTER TABLE referrals 
        ADD CONSTRAINT referrals_referrer_id_referred_id_key 
        UNIQUE(referrer_id, referred_id);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
