-- Add verification service tables for Textverified integration
-- Created: 2025

-- Verification services (apps/websites available for number verification)
CREATE TABLE IF NOT EXISTS verification_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    textverified_service_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('social_media', 'ecommerce_financial', 'professional_tools', 'streaming_entertainment')),
    description TEXT,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    base_cost DECIMAL(10, 2) NOT NULL,
    markup_percentage DECIMAL(5, 2) DEFAULT 30.00,
    rental_multiplier DECIMAL(5, 2) DEFAULT 2.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User purchased/rented phone numbers
CREATE TABLE IF NOT EXISTS verification_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES verification_services(id),
    number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('onetime', 'rental')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    textverified_target_id VARCHAR(100),
    textverified_order_id VARCHAR(100) UNIQUE,
    purchase_price DECIMAL(10, 2) NOT NULL,
    rental_duration_hours INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS messages received on Foreign Numbers
CREATE TABLE IF NOT EXISTS verification_sms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number_id UUID NOT NULL REFERENCES verification_numbers(id) ON DELETE CASCADE,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    textverified_sms_id VARCHAR(100) UNIQUE,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Rental extension records
CREATE TABLE IF NOT EXISTS verification_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number_id UUID NOT NULL REFERENCES verification_numbers(id) ON DELETE CASCADE,
    extension_hours INTEGER NOT NULL,
    extension_price DECIMAL(10, 2) NOT NULL,
    new_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update transactions table to support verification types
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('deposit', 'airtime', 'data', 'verification_onetime', 'verification_rental', 'verification_extension'));

-- Add verification reference to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verification_number_id UUID REFERENCES verification_numbers(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_services_category ON verification_services(category);
CREATE INDEX IF NOT EXISTS idx_verification_services_active ON verification_services(is_active);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_user_id ON verification_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_service_id ON verification_numbers(service_id);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_status ON verification_numbers(status);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_expires_at ON verification_numbers(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_sms_number_id ON verification_sms(number_id);
CREATE INDEX IF NOT EXISTS idx_verification_sms_received_at ON verification_sms(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_verification_number_id ON transactions(verification_number_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_verification_services_updated_at ON verification_services;
CREATE TRIGGER update_verification_services_updated_at
    BEFORE UPDATE ON verification_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verification_numbers_updated_at ON verification_numbers;
CREATE TRIGGER update_verification_numbers_updated_at
    BEFORE UPDATE ON verification_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample verification services (these would normally sync from Textverified API)
INSERT INTO verification_services (textverified_service_id, name, category, description, base_cost, markup_percentage) VALUES
('whatsapp', 'WhatsApp', 'social_media', 'Verify WhatsApp accounts with temporary US numbers', 1.50, 30.00),
('telegram', 'Telegram', 'social_media', 'Create Telegram accounts with Foreign Numbers', 1.50, 30.00),
('facebook', 'Facebook', 'social_media', 'Facebook account Foreign Numbers', 2.00, 30.00),
('instagram', 'Instagram', 'social_media', 'Instagram account verification', 2.00, 30.00),
('twitter', 'Twitter / X', 'social_media', 'Twitter/X account verification', 2.00, 30.00),
('tiktok', 'TikTok', 'social_media', 'TikTok account verification', 1.75, 30.00),
('snapchat', 'Snapchat', 'social_media', 'Snapchat account verification', 1.75, 30.00),
('google', 'Google / Gmail', 'social_media', 'Google services verification', 1.50, 30.00),
('microsoft', 'Microsoft', 'social_media', 'Microsoft account verification', 1.50, 30.00),
('amazon', 'Amazon', 'ecommerce_financial', 'Amazon account verification', 2.50, 40.00),
('ebay', 'eBay', 'ecommerce_financial', 'eBay account verification', 2.50, 40.00),
('paypal', 'PayPal', 'ecommerce_financial', 'PayPal account verification', 3.00, 40.00),
('venmo', 'Venmo', 'ecommerce_financial', 'Venmo account verification', 2.50, 40.00),
('cashapp', 'Cash App', 'ecommerce_financial', 'Cash App verification', 2.50, 40.00),
('stripe', 'Stripe', 'ecommerce_financial', 'Stripe account verification', 3.00, 40.00),
('discord', 'Discord', 'professional_tools', 'Discord account verification', 1.50, 35.00),
('slack', 'Slack', 'professional_tools', 'Slack workspace verification', 2.00, 35.00),
('zoom', 'Zoom', 'professional_tools', 'Zoom account verification', 1.75, 35.00),
('linkedin', 'LinkedIn', 'professional_tools', 'LinkedIn account verification', 2.00, 35.00),
('netflix', 'Netflix', 'streaming_entertainment', 'Netflix account verification', 2.00, 35.00),
('spotify', 'Spotify', 'streaming_entertainment', 'Spotify account verification', 1.75, 35.00),
('youtube', 'YouTube Premium', 'streaming_entertainment', 'YouTube verification', 1.75, 35.00),
('hulu', 'Hulu', 'streaming_entertainment', 'Hulu account verification', 1.75, 35.00),
('disneyplus', 'Disney+', 'streaming_entertainment', 'Disney+ account verification', 1.75, 35.00)
ON CONFLICT (textverified_service_id) DO NOTHING;
