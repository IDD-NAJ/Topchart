-- Migration: Create service_status table for Coming Soon feature
-- This table stores the status configuration for each service on the platform

CREATE TABLE IF NOT EXISTS service_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key VARCHAR(50) UNIQUE NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_coming_soon BOOLEAN DEFAULT false,
  coming_soon_message TEXT DEFAULT 'This service is coming soon. Stay tuned!',
  expected_launch_date DATE,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon_name VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Audit table for tracking changes
CREATE TABLE IF NOT EXISTS service_status_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_status_id UUID REFERENCES service_status(id) ON DELETE CASCADE,
  service_key VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'coming_soon_enabled', 'coming_soon_disabled'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_status_service_key ON service_status(service_key);
CREATE INDEX IF NOT EXISTS idx_service_status_is_coming_soon ON service_status(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_service_status_is_enabled ON service_status(is_enabled);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_service_id ON service_status_audit(service_status_id);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_changed_at ON service_status_audit(changed_at DESC);

-- Insert default services
INSERT INTO service_status (service_key, service_name, description, display_order, icon_name) VALUES
  ('airtime', 'Airtime', 'Mobile airtime top-up services', 1, 'Phone'),
  ('data', 'Data Bundles', 'Mobile data bundle purchases', 2, 'Wifi'),
  ('esim', 'eSIM', 'International eSIM services', 3, 'Smartphone'),
  ('verification', 'Verification', 'Phone verification services', 4, 'Shield'),
  ('proxy', 'Proxy', 'Proxy and VPN services', 5, 'Globe2'),
  ('giftcards', 'Gift Cards', 'Digital gift card purchases', 6, 'Gift'),
  ('bills', 'Bill Payments', 'Utility and bill payment services', 7, 'Receipt'),
  ('result_checker', 'Result Checker', 'Exam result checking services', 8, 'FileText')
ON CONFLICT (service_key) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_service_status_updated_at ON service_status;
CREATE TRIGGER trigger_service_status_updated_at
  BEFORE UPDATE ON service_status
  FOR EACH ROW
  EXECUTE FUNCTION update_service_status_updated_at();
