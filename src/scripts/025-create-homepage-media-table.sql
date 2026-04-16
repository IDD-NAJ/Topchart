CREATE TABLE IF NOT EXISTS homepage_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(120) NOT NULL,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('image', 'video')),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_sort
    ON homepage_media(section_key, is_active, sort_order);

CREATE OR REPLACE FUNCTION update_homepage_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_homepage_media_updated_at ON homepage_media;
CREATE TRIGGER update_homepage_media_updated_at
    BEFORE UPDATE ON homepage_media
    FOR EACH ROW
    EXECUTE FUNCTION update_homepage_media_updated_at();

INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active) VALUES
('mtn_logo', 'image', 'seed/mtn-logo.svg', '/images/mtn-logo.svg', 'MTN logo', 1, TRUE),
('telecel_logo', 'image', 'seed/telecel-logo.svg', '/images/telecel-logo.svg', 'Telecel logo', 2, TRUE),
('airteltigo_logo', 'image', 'seed/airteltigo-logo.svg', '/images/airteltigo-logo.svg', 'AirtelTigo logo', 3, TRUE),
('developer_community_image', 'image', 'seed/technical-partnership.jpg', '/images/technical-partnership.jpg', 'A user looking at code metrics', 4, TRUE)
ON CONFLICT DO NOTHING;
