CREATE TABLE IF NOT EXISTS homepage_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_key VARCHAR(120) NOT NULL UNIQUE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_images_active_sort
    ON homepage_images(is_active, sort_order);

CREATE OR REPLACE FUNCTION update_homepage_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_homepage_images_updated_at ON homepage_images;
CREATE TRIGGER update_homepage_images_updated_at
    BEFORE UPDATE ON homepage_images
    FOR EACH ROW
    EXECUTE FUNCTION update_homepage_images_updated_at();

INSERT INTO homepage_images (image_key, image_url, alt_text, sort_order, is_active) VALUES
('mtn_logo', '/images/mtn-logo.svg', 'MTN logo', 1, TRUE),
('telecel_logo', '/images/telecel-logo.svg', 'Telecel logo', 2, TRUE),
('airteltigo_logo', '/images/airteltigo-logo.svg', 'AirtelTigo logo', 3, TRUE),
('developer_community_image', '/images/technical-partnership.jpg', 'A user looking at code metrics', 4, TRUE)
ON CONFLICT (image_key) DO UPDATE
SET
    image_url = EXCLUDED.image_url,
    alt_text = EXCLUDED.alt_text,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
