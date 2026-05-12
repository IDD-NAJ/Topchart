CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'GHS',
    reference VARCHAR(100) UNIQUE,
    description TEXT,
    source TEXT,
    payment_method VARCHAR(50),
    payment_channel VARCHAR(50),
    network VARCHAR(20),
    phone_number VARCHAR(20),
    data_plan VARCHAR(100),
    verification_number_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    fees DECIMAL(12, 2) DEFAULT 0.00,
    paystack_reference VARCHAR(100),
    paystack_access_code VARCHAR(100),
    paystack_authorization_url TEXT,
    card_type VARCHAR(50),
    card_last4 VARCHAR(4),
    bank_name VARCHAR(100),
    ip_address VARCHAR(45),
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(12, 2),
    refund_reason TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_reference ON transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);

GRANT ALL ON TABLE transactions TO authenticator;
