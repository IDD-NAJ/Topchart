-- Migration: Add dynamic pricing tables for eSIM, Gift Cards, and Proxies
-- Created: 2026-04-19

-- eSIM Phone Plans (US phone numbers)
CREATE TABLE IF NOT EXISTS esim_phone_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  sms INTEGER NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 30,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- eSIM Data Packages (Travel data eSIMs)
CREATE TABLE IF NOT EXISTS esim_data_packages (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  flag TEXT,
  data_allowance TEXT NOT NULL,
  validity TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  network TEXT,
  speed TEXT DEFAULT '4G/LTE',
  region TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Gift Card Products
CREATE TABLE IF NOT EXISTS gift_card_products (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT,
  denominations JSONB NOT NULL DEFAULT '[]'::jsonb,
  image TEXT,
  markup_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Proxy Pricing
CREATE TABLE IF NOT EXISTS proxy_pricing (
  id SERIAL PRIMARY KEY,
  proxy_type INTEGER UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  price_per_port DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_esim_phone_plans_active ON esim_phone_plans(is_active);
CREATE INDEX idx_esim_data_packages_active ON esim_data_packages(is_active);
CREATE INDEX idx_esim_data_packages_region ON esim_data_packages(region);
CREATE INDEX idx_gift_card_products_active ON gift_card_products(is_active);
CREATE INDEX idx_gift_card_products_category ON gift_card_products(category);

-- Insert seed data for eSIM phone plans (matching current hardcoded values)
INSERT INTO esim_phone_plans (id, name, price, minutes, sms, validity_days, features, is_active, popular, sort_order) VALUES
('us-basic', 'US Basic', 120, 100, 100, 30, '["US phone number", "Call forwarding", "SMS receive", "30-day validity"]', true, false, 1),
('us-premium', 'US Premium', 200, 500, 500, 30, '["US phone number", "Unlimited incoming SMS", "Call forwarding", "Voicemail", "30-day validity"]', true, true, 2),
('us-business', 'US Business', 350, 999, 999, 90, '["US phone number", "Unlimited SMS & calls", "Call forwarding", "Voicemail", "Multi-device support", "90-day validity"]', true, false, 3)
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for eSIM data packages
INSERT INTO esim_data_packages (id, country, country_code, flag, data_allowance, validity, price, network, speed, region, is_active, sort_order) VALUES
('gh-1gb-7d', '', 'GH', '🇬🇭', '1 GB', '7 Days', 15, 'MTN / Telecel', '4G/LTE', 'africa', true, 1),
('gh-3gb-30d', '', 'GH', '🇬🇭', '3 GB', '30 Days', 35, 'MTN / Telecel', '4G/LTE', 'africa', true, 2),
('gh-5gb-30d', '', 'GH', '🇬🇭', '5 GB', '30 Days', 55, 'MTN / Telecel', '4G/LTE', 'africa', true, 3),
('ng-2gb-7d', 'Nigeria', 'NG', '🇳🇬', '2 GB', '7 Days', 20, 'MTN / Airtel', '4G/LTE', 'africa', true, 4),
('ng-5gb-30d', 'Nigeria', 'NG', '🇳🇬', '5 GB', '30 Days', 50, 'MTN / Airtel', '4G/LTE', 'africa', true, 5),
('ke-3gb-30d', 'Kenya', 'KE', '🇰🇪', '3 GB', '30 Days', 30, 'Safaricom', '4G/LTE', 'africa', true, 6),
('za-2gb-30d', 'South Africa', 'ZA', '🇿🇦', '2 GB', '30 Days', 30, 'Vodacom / MTN', '4G/LTE', 'africa', true, 7),
('uk-1gb-7d', 'United Kingdom', 'GB', '🇬🇧', '1 GB', '7 Days', 25, 'EE / Three', '5G/4G', 'europe', true, 8),
('uk-5gb-30d', 'United Kingdom', 'GB', '🇬🇧', '5 GB', '30 Days', 65, 'EE / Three', '5G/4G', 'europe', true, 9),
('us-3gb-7d', 'United States', 'US', '🇺🇸', '3 GB', '7 Days', 30, 'T-Mobile / AT&T', '5G/4G', 'americas', true, 10),
('us-10gb-30d', 'United States', 'US', '🇺🇸', '10 GB', '30 Days', 80, 'T-Mobile / AT&T', '5G/4G', 'americas', true, 11),
('ae-2gb-7d', 'UAE', 'AE', '🇦🇪', '2 GB', '7 Days', 35, 'Etisalat / du', '5G/4G', 'middle_east', true, 12),
('ae-5gb-30d', 'UAE', 'AE', '🇦🇪', '5 GB', '30 Days', 75, 'Etisalat / du', '5G/4G', 'middle_east', true, 13),
('in-3gb-30d', 'India', 'IN', '🇮🇳', '3 GB', '30 Days', 20, 'Jio / Airtel', '4G/LTE', 'asia', true, 14)
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for gift cards
INSERT INTO gift_card_products (id, brand, category, region, denominations, image, markup_percentage, is_active, sort_order) VALUES
('netflix', 'Netflix', 'entertainment', 'Global', '[30, 50, 100]', '🎬', 0, true, 1),
('spotify', 'Spotify', 'entertainment', 'Global', '[15, 30, 60]', '🎵', 0, true, 2),
('amazon', 'Amazon', 'shopping', 'US/Global', '[25, 50, 100, 200]', '📦', 0, true, 3),
('google-play', 'Google Play', 'shopping', 'Global', '[10, 25, 50]', '▶️', 0, true, 4),
('itunes', 'Apple/iTunes', 'shopping', 'Global', '[15, 25, 50, 100]', '🍎', 0, true, 5),
('steam', 'Steam', 'gaming', 'Global', '[20, 50, 100]', '🎮', 0, true, 6),
('playstation', 'PlayStation', 'gaming', 'US/EU', '[25, 50, 100]', '🎯', 0, true, 7),
('xbox', 'Xbox', 'gaming', 'US/EU', '[25, 50, 100]', '🟢', 0, true, 8),
('uber', 'Uber', 'lifestyle', '', '[20, 50, 100]', '🚗', 0, true, 9),
('airbnb', 'Airbnb', 'lifestyle', 'Global', '[50, 100, 200]', '🏠', 0, true, 10)
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for proxy pricing
INSERT INTO proxy_pricing (proxy_type, label, description, price_per_port, is_active) VALUES
(1, 'Residential', 'Real residential IPs — hardest to detect', 2.00, true),
(2, 'Mobile', 'Mobile carrier IPs — ideal for social/mobile', 3.00, true),
(3, 'Datacenter', 'Fast datacenter IPs — best for high volume', 1.00, true)
ON CONFLICT (proxy_type) DO NOTHING;
