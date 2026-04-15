-- Create data_bundle_categories table
CREATE TABLE IF NOT EXISTS data_bundle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    network VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data_bundles table
CREATE TABLE IF NOT EXISTS data_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES data_bundle_categories(id) ON DELETE SET NULL,
    network_id VARCHAR(50) NOT NULL,
    network VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    size_mb VARCHAR(50),
    size_gb VARCHAR(50),
    validity_hours INTEGER,
    validity_days INTEGER,
    validity TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    datamart_plan_id VARCHAR(255),
    datamart_plan_type VARCHAR(100),
    metadata JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_bundles_network_id ON data_bundles(network_id);
CREATE INDEX IF NOT EXISTS idx_data_bundles_category_id ON data_bundles(category_id);
CREATE INDEX IF NOT EXISTS idx_data_bundles_network ON data_bundles(network);
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_active ON data_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_data_bundles_is_popular ON data_bundles(is_popular);
CREATE INDEX IF NOT EXISTS idx_data_bundles_datamart_plan_id ON data_bundles(datamart_plan_id);
CREATE INDEX IF NOT EXISTS idx_data_bundle_categories_network ON data_bundle_categories(network);
CREATE INDEX IF NOT EXISTS idx_data_bundle_categories_is_active ON data_bundle_categories(is_active);

-- Create trigger for updated_at on data_bundles
DROP TRIGGER IF EXISTS update_data_bundles_updated_at ON data_bundles;
CREATE TRIGGER update_data_bundles_updated_at
    BEFORE UPDATE ON data_bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on data_bundle_categories
DROP TRIGGER IF EXISTS update_data_bundle_categories_updated_at ON data_bundle_categories;
CREATE TRIGGER update_data_bundle_categories_updated_at
    BEFORE UPDATE ON data_bundle_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default categories
INSERT INTO data_bundle_categories (name, network, sort_order, is_active) VALUES
('MTN Daily', 'MTN', 1, TRUE),
('MTN Weekly', 'MTN', 2, TRUE),
('MTN Monthly', 'MTN', 3, TRUE),
('Telecel Daily', 'Telecel', 4, TRUE),
('Telecel Weekly', 'Telecel', 5, TRUE),
('Telecel Monthly', 'Telecel', 6, TRUE),
('AirtelTigo Daily', 'AirtelTigo', 7, TRUE),
('AirtelTigo Weekly', 'AirtelTigo', 8, TRUE),
('AirtelTigo Monthly', 'AirtelTigo', 9, TRUE)
ON CONFLICT (name) DO NOTHING;
