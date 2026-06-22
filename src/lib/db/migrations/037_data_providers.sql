-- Create data_providers table for managing provider configuration
CREATE TABLE IF NOT EXISTS data_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(50) NOT NULL UNIQUE,
  provider_type VARCHAR(50) NOT NULL DEFAULT 'data_bundle',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on provider_type for faster queries
CREATE INDEX IF NOT EXISTS idx_data_providers_type ON data_providers(provider_type);

-- Create index on is_enabled for filtering active providers
CREATE INDEX IF NOT EXISTS idx_data_providers_enabled ON data_providers(is_enabled) WHERE is_enabled = true;

-- Seed initial providers
INSERT INTO data_providers (provider_name, provider_type, is_enabled, is_primary, is_fallback, priority, config) VALUES
  ('datamart', 'data_bundle', true, true, false, 1, '{"api_endpoint": "/api/developer", "supports_data_bundles": true}'::jsonb),
  ('hubnet', 'data_bundle', true, false, true, 2, '{"api_endpoint": "/api", "supports_data_bundles": true}'::jsonb)
ON CONFLICT (provider_name) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  is_primary = EXCLUDED.is_primary,
  is_fallback = EXCLUDED.is_fallback,
  priority = EXCLUDED.priority,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_data_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_data_providers_updated_at
  BEFORE UPDATE ON data_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_data_providers_updated_at();

-- Add comment to table
COMMENT ON TABLE data_providers IS 'Configuration table for data providers (DataMart, Hubnet, etc.) with primary/fallback settings';
