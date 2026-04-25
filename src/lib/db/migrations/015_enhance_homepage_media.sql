-- Migration: Enhance homepage_media table for full media management
-- Created: 2025

-- Add missing fields to homepage_media table
ALTER TABLE homepage_media 
ADD COLUMN IF NOT EXISTS storage_source TEXT CHECK (storage_source IN ('local', 'supabase')),
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Rename sort_order to priority for clarity
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'homepage_media' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE homepage_media RENAME COLUMN sort_order TO priority;
    END IF;
END $$;

-- Update existing records to set default values
UPDATE homepage_media 
SET storage_source = 'supabase' 
WHERE storage_source IS NULL AND storage_path LIKE 'https://%';

UPDATE homepage_media 
SET storage_source = 'local' 
WHERE storage_source IS NULL AND storage_path LIKE '/%';

-- Set default priority for existing records
UPDATE homepage_media 
SET priority = 0 
WHERE priority IS NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_homepage_media_storage_source ON homepage_media(storage_source);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_priority ON homepage_media(section_key, is_active, priority);

-- Add comments for documentation
COMMENT ON COLUMN homepage_media.storage_source IS 'Storage source: local or supabase';
COMMENT ON COLUMN homepage_media.file_name IS 'Original file name';
COMMENT ON COLUMN homepage_media.mime_type IS 'File MIME type (e.g., image/jpeg, video/mp4)';
COMMENT ON COLUMN homepage_media.file_size IS 'File size in bytes';
COMMENT ON COLUMN homepage_media.priority IS 'Priority for ordering multiple assets (higher = first)';
