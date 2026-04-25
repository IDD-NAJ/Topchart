-- Migration 013: Create press kit tables
-- Tables: press_stats, press_assets

-- Press stats table for press kit statistics
CREATE TABLE IF NOT EXISTS press_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    color_gradient VARCHAR(100) NOT NULL DEFAULT 'from-gray-500/20 to-gray-500/5',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Press assets table for downloadable press materials
CREATE TABLE IF NOT EXISTS press_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('logo_pack', 'fact_sheet', 'brand_guidelines', 'media_kit')),
    description TEXT,
    download_url TEXT,
    file_size VARCHAR(20),
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_press_stats_is_active ON press_stats(is_active);
CREATE INDEX IF NOT EXISTS idx_press_stats_sort_order ON press_stats(sort_order);
CREATE INDEX IF NOT EXISTS idx_press_assets_is_active ON press_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_press_assets_type ON press_assets(asset_type);

-- Trigger for updated_at on press_assets
CREATE OR REPLACE FUNCTION update_press_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_press_assets_updated_at ON press_assets;
CREATE TRIGGER update_press_assets_updated_at
    BEFORE UPDATE ON press_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_press_assets_updated_at();

-- Seed default press stats (matching current hardcoded values)
INSERT INTO press_stats (value, label, color_gradient, sort_order, is_active) VALUES
('2023', 'Founded', 'from-blue-500/20 to-blue-500/5', 1, TRUE),
('500K+', 'Users', 'from-amber-500/20 to-amber-500/5', 2, TRUE),
('3', 'Networks', 'from-rose-500/20 to-rose-500/5', 3, TRUE),
('99.9%', 'Uptime', 'from-emerald-500/20 to-emerald-500/5', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Seed default press assets (matching current hardcoded values)
INSERT INTO press_assets (name, asset_type, description, is_active) VALUES
('Brand Assets', 'logo_pack', 'Official logos, brand guidelines, color palettes, and typography specifications for all approved media use.', TRUE),
('Company Fact Sheet', 'fact_sheet', 'Key facts, statistics, milestones, and background information about Topchart for journalists and media outlets.', TRUE)
ON CONFLICT DO NOTHING;
