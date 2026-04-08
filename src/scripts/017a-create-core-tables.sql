-- Simple migration: Create verification tables without complex dependencies
-- Part 1: Core tables (no FKs)

-- 1. verification_services
CREATE TABLE IF NOT EXISTS verification_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pvadeals_service_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    picture_url VARCHAR(500),
    country VARCHAR(10) DEFAULT 'US',
    is_active BOOLEAN DEFAULT TRUE,
    markup_percentage DECIMAL(5, 2) DEFAULT 40.00,
    str_price DECIMAL(10, 4) DEFAULT 0,
    ltr3_price DECIMAL(10, 4) DEFAULT 0,
    ltr7_price DECIMAL(10, 4) DEFAULT 0,
    ltr14_price DECIMAL(10, 4) DEFAULT 0,
    ltr30_price DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. verification_numbers (no FKs initially)
CREATE TABLE IF NOT EXISTS verification_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_id UUID NOT NULL,
    number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    pvadeals_request_id VARCHAR(100) UNIQUE,
    ltr_duration_days INTEGER,
    allow_flag BOOLEAN DEFAULT TRUE,
    allow_reuse BOOLEAN DEFAULT FALSE,
    auto_renew BOOLEAN DEFAULT FALSE,
    purchase_price DECIMAL(10, 2) NOT NULL,
    rental_duration_hours INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. verification_sms (no FKs initially)
CREATE TABLE IF NOT EXISTS verification_sms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number_id UUID NOT NULL,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    pvadeals_sms_id VARCHAR(100) UNIQUE,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);
