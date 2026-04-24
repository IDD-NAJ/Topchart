-- Migration: 030-optimize-homepage-media.sql
-- Purpose: Add responsive media support columns for optimized display across devices
-- Date: 2024

-- Add width and height columns for images (nullable for existing records)
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS width INTEGER;

ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Add duration for video files (in seconds, with decimal for precision)
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2);

-- Add thumbnail URL for video preview
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add blurhash for image placeholders (progressive loading)
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS blurhash TEXT;

-- Add responsive URLs as JSONB for multiple sizes
-- Structure: { "320": "url", "640": "url", "1280": "url", "1920": "url" }
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS responsive_urls JSONB DEFAULT '{}';

-- Add aspect_ratio for responsive layouts (e.g., "16:9", "4:3", "1:1")
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10);

-- Add focal_point for smart cropping (JSONB: {"x": 0.5, "y": 0.5})
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS focal_point JSONB;

-- Add loading_priority for resource hints (eager, lazy, auto)
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS loading_priority VARCHAR(10) DEFAULT 'auto';

-- Create index for quick dimension lookups
CREATE INDEX IF NOT EXISTS idx_homepage_media_dimensions 
ON homepage_media(width, height) 
WHERE width IS NOT NULL AND height IS NOT NULL;

-- Create index for responsive_urls queries
CREATE INDEX IF NOT EXISTS idx_homepage_media_responsive 
ON homepage_media USING GIN (responsive_urls) 
WHERE responsive_urls IS NOT NULL AND responsive_urls != '{}';

-- Add constraint for loading_priority values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'homepage_media_loading_priority_check'
  ) THEN
    ALTER TABLE homepage_media 
    ADD CONSTRAINT homepage_media_loading_priority_check 
    CHECK (loading_priority IN ('eager', 'lazy', 'auto'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add helpful comments
COMMENT ON COLUMN homepage_media.width IS 'Original image width in pixels';
COMMENT ON COLUMN homepage_media.height IS 'Original image height in pixels';
COMMENT ON COLUMN homepage_media.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN homepage_media.thumbnail_url IS 'Video thumbnail/poster image URL';
COMMENT ON COLUMN homepage_media.blurhash IS 'BlurHash string for progressive image loading';
COMMENT ON COLUMN homepage_media.responsive_urls IS 'JSON object with responsive image URLs by width';
COMMENT ON COLUMN homepage_media.aspect_ratio IS 'Aspect ratio string (e.g., 16:9, 4:3)';
COMMENT ON COLUMN homepage_media.focal_point IS 'Focal point for smart cropping: {"x": 0-1, "y": 0-1}';
COMMENT ON COLUMN homepage_media.loading_priority IS 'Loading strategy: eager (above-fold), lazy (below-fold), auto';
