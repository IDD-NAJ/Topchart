-- Reset transactions table to match current application schema.
-- This will DROP the existing transactions table and recreate it.
-- NOTE: Existing transactions data (if any) will be lost.

DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'airtime', 'data')),
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    network VARCHAR(20),
    phone_number VARCHAR(20),
    data_plan VARCHAR(100),
    payment_method VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Paystack payment tracking columns (from 002-add-paystack-columns.sql)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_access_code VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_authorization_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS card_type VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'GHS';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fees DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);

