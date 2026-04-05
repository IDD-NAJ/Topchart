-- Migration 016: Fix reseller tables (missing tables + missing columns)
-- Safe to run multiple times (all statements are idempotent)

-- Reseller Applications Table
CREATE TABLE IF NOT EXISTS reseller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    business_type VARCHAR(50),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_document_url TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    application_status VARCHAR(20) DEFAULT 'pending',
    application_fee DECIMAL(10, 2) DEFAULT 100.00,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(100),
    transaction_id UUID,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to reseller_applications if table already existed without them
ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Reseller Profiles Table
CREATE TABLE IF NOT EXISTS reseller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT,
    business_phone VARCHAR(20),
    reseller_code VARCHAR(20) UNIQUE,
    commission_rate DECIMAL(5, 2) DEFAULT 5.00,
    discount_rate DECIMAL(5, 2) DEFAULT 10.00,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_sales DECIMAL(12, 2) DEFAULT 0.00,
    total_commission_earned DECIMAL(12, 2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reseller Sales Table
CREATE TABLE IF NOT EXISTS reseller_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20),
    product_type VARCHAR(50),
    network VARCHAR(50),
    bundle_id UUID,
    amount DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reseller Commission Table
CREATE TABLE IF NOT EXISTS reseller_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id),
    transaction_id UUID,
    transaction_amount DECIMAL(10, 2),
    commission_amount DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System configuration table for admin settings
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Custom form fields for reseller application
CREATE TABLE IF NOT EXISTS custom_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_options JSONB,
    is_required BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,
    placeholder TEXT,
    help_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default reseller application configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('reseller_form_config', '{
  "business_name": {"enabled": true, "required": true},
  "business_address": {"enabled": true, "required": false},
  "business_phone": {"enabled": true, "required": false},
  "business_email": {"enabled": true, "required": false},
  "business_type": {"enabled": true, "required": false},
  "application_fee": 100.00,
  "currency": "GHS",
  "require_payment_before_approval": true
}'::jsonb, 'Reseller application form configuration'),
('reseller_form_custom_fields', '[]'::jsonb, 'Custom fields for reseller application form')
ON CONFLICT (config_key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON reseller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code ON reseller_profiles(reseller_code);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller ON reseller_sales(reseller_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
