-- Migration: Create homepage_media table for admin-controlled media management
-- Created: 2024

-- Drop table if exists for clean migration
DROP TABLE IF EXISTS homepage_media;

-- Create homepage_media table
CREATE TABLE IF NOT EXISTS homepage_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video')),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_key ON homepage_media(section_key);
CREATE INDEX IF NOT EXISTS idx_homepage_media_is_active ON homepage_media(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active ON homepage_media(section_key, is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_media_sort_order ON homepage_media(sort_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_homepage_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_homepage_media_updated_at ON homepage_media;
CREATE TRIGGER trigger_homepage_media_updated_at
    BEFORE UPDATE ON homepage_media
    FOR EACH ROW
    EXECUTE FUNCTION update_homepage_media_updated_at();

-- Insert default seed data for hero section (only if table is empty)
INSERT INTO homepage_media (id, section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'hero_background_video',
    'image',
    'seed/default_hero.jpg',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80',
    'Default Hero Background',
    0,
    true
WHERE NOT EXISTS (SELECT 1 FROM homepage_media LIMIT 1);

