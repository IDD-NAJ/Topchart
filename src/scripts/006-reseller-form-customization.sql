-- Migration: Add reseller form customization tables
-- Created: 2026-01-04

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
  field_type VARCHAR(50) NOT NULL, -- text, number, select, textarea, email, phone
  field_options JSONB, -- For select fields
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

-- Insert default custom fields (empty initially)

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
