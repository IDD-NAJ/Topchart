-- Giftcard Service Database Schema
-- Migration: 021-add-giftcard-tables.sql

-- Gift card orders table
CREATE TABLE IF NOT EXISTS giftcard_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE SET NULL,
    reloadly_order_id VARCHAR(100) UNIQUE,
    reloadly_product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    denomination DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_name VARCHAR(255),
    is_gift BOOLEAN DEFAULT FALSE,
    sender_message TEXT,
    gift_card_code TEXT,
    pin_code TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
    amount_ghs DECIMAL(12, 2) NOT NULL,
    reloadly_cost_usd DECIMAL(12, 2),
    markup_percentage DECIMAL(5, 2) DEFAULT 40.00,
    commission_amount DECIMAL(12, 2) DEFAULT 0.00,
    commission_rate DECIMAL(5, 2),
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift card product configurations (admin pricing overrides)
CREATE TABLE IF NOT EXISTS giftcard_product_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reloadly_product_id VARCHAR(100) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    custom_markup_percentage DECIMAL(5, 2),
    min_denomination DECIMAL(12, 2),
    max_denomination DECIMAL(12, 2),
    restricted_to_resellers BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reloadly API balance tracking
CREATE TABLE IF NOT EXISTS reloadly_balance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance_usd DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for giftcard_orders
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_user_id ON giftcard_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_reseller_id ON giftcard_orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_status ON giftcard_orders(status);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_created_at ON giftcard_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_giftcard_orders_reloadly_order_id ON giftcard_orders(reloadly_order_id);

-- Indexes for giftcard_product_configs
CREATE INDEX IF NOT EXISTS idx_giftcard_product_configs_product_id ON giftcard_product_configs(reloadly_product_id);
CREATE INDEX IF NOT EXISTS idx_giftcard_product_configs_enabled ON giftcard_product_configs(is_enabled);

-- Index for reloadly_balance_log
CREATE INDEX IF NOT EXISTS idx_reloadly_balance_log_logged_at ON reloadly_balance_log(logged_at DESC);

-- Update transactions table to support giftcard type
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('deposit', 'airtime', 'data', 'giftcard'));

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for giftcard_orders
DROP TRIGGER IF EXISTS update_giftcard_orders_updated_at ON giftcard_orders;
CREATE TRIGGER update_giftcard_orders_updated_at
    BEFORE UPDATE ON giftcard_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for giftcard_product_configs
DROP TRIGGER IF EXISTS update_giftcard_product_configs_updated_at ON giftcard_product_configs;
CREATE TRIGGER update_giftcard_product_configs_updated_at
    BEFORE UPDATE ON giftcard_product_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
