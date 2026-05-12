-- Add Paystack payment tracking columns to transactions table

-- Add paystack-specific columns
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

-- Create index for paystack reference lookups
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);

-- Create payment_logs table for webhook events and audit trail
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    ip_address VARCHAR(45),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
