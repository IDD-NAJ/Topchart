-- Simple migration: Indexes and triggers
-- Part 2: Indexes and helper function

-- Indexes for verification_services
CREATE INDEX IF NOT EXISTS idx_verification_services_category ON verification_services(category);
CREATE INDEX IF NOT EXISTS idx_verification_services_active ON verification_services(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_services_pvadeals_id ON verification_services(pvadeals_service_id);

-- Indexes for verification_numbers
CREATE INDEX IF NOT EXISTS idx_verification_numbers_user_id ON verification_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_service_id ON verification_numbers(service_id);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_status ON verification_numbers(status);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_expires_at ON verification_numbers(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_pvadeals_request ON verification_numbers(pvadeals_request_id);

-- Indexes for verification_sms
CREATE INDEX IF NOT EXISTS idx_verification_sms_number_id ON verification_sms(number_id);
CREATE INDEX IF NOT EXISTS idx_verification_sms_received_at ON verification_sms(received_at DESC);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
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
