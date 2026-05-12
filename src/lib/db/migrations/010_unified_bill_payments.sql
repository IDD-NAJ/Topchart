-- Migration: Unified Bill Payment System with VTpass + Datamart
-- Created: 2026-04-20

-- Drop old Reloadly-specific bill tables if they exist
DROP TABLE IF EXISTS bill_transactions_old CASCADE;

-- Create unified bill transactions table
CREATE TABLE bill_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('vtpass', 'datamart')),
  service_id VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('electricity', 'tv', 'internet', 'water')),
  account_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(200),
  amount DECIMAL(12, 2) NOT NULL,
  fee DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  reference VARCHAR(100) UNIQUE NOT NULL,
  provider_reference VARCHAR(100),
  variation_code VARCHAR(50),
  phone_number VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  raw_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for bill transactions
CREATE INDEX idx_bill_transactions_user_id ON bill_transactions(user_id);
CREATE INDEX idx_bill_transactions_reference ON bill_transactions(reference);
CREATE INDEX idx_bill_transactions_provider_ref ON bill_transactions(provider_reference);
CREATE INDEX idx_bill_transactions_status ON bill_transactions(status);
CREATE INDEX idx_bill_transactions_category ON bill_transactions(category);
CREATE INDEX idx_bill_transactions_created_at ON bill_transactions(created_at DESC);
CREATE INDEX idx_bill_transactions_user_created ON bill_transactions(user_id, created_at DESC);

-- Provider configuration table
CREATE TABLE bill_provider_config (
  id VARCHAR(20) PRIMARY KEY CHECK (id IN ('vtpass', 'datamart')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  markup_percent DECIMAL(5, 2) DEFAULT 0,
  daily_limit DECIMAL(12, 2),
  daily_volume DECIMAL(12, 2) DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default provider configurations
INSERT INTO bill_provider_config (id, enabled, priority) VALUES
('vtpass', true, 1),
('datamart', true, 2)
ON CONFLICT (id) DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority;

-- Service availability tracking table
CREATE TABLE bill_service_availability (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_verified TIMESTAMP WITH TIME ZONE,
  min_amount DECIMAL(12, 2) DEFAULT 0,
  max_amount DECIMAL(12, 2) DEFAULT 999999,
  requires_validation BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for service lookups
CREATE INDEX idx_bill_service_availability_category ON bill_service_availability(category);
CREATE INDEX idx_bill_service_availability_provider ON bill_service_availability(provider);
CREATE INDEX idx_bill_service_availability_active ON bill_service_availability(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_bill_transactions_updated_at 
    BEFORE UPDATE ON bill_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_provider_config_updated_at 
    BEFORE UPDATE ON bill_provider_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_service_availability_updated_at 
    BEFORE UPDATE ON bill_service_availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Daily stats aggregation table
CREATE TABLE bill_daily_stats (
  date DATE PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  total_fees DECIMAL(12, 2) DEFAULT 0,
  avg_response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bill_daily_stats_provider ON bill_daily_stats(provider);
CREATE INDEX idx_bill_daily_stats_date ON bill_daily_stats(date DESC);

-- Comment explaining the migration
COMMENT ON TABLE bill_transactions IS 'Unified bill payment transactions from VTpass and Datamart providers';
COMMENT ON TABLE bill_provider_config IS 'Configuration and health status for bill payment providers';
COMMENT ON TABLE bill_service_availability IS 'Cached service availability from providers';
COMMENT ON TABLE bill_daily_stats IS 'Aggregated daily statistics per provider';
