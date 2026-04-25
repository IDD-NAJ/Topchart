-- Migration: Add status and version fields to homepage_media for advanced lifecycle management
-- Created: 2026

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_status') THEN
    CREATE TYPE homepage_media_status AS ENUM ('active', 'inactive', 'archived');
  END IF;
END $$;

ALTER TABLE homepage_media
  ADD COLUMN IF NOT EXISTS status homepage_media_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Migrate existing is_active to status
UPDATE homepage_media
SET status = CASE
  WHEN is_active = true THEN 'active'::homepage_media_status
  ELSE 'inactive'::homepage_media_status
END
WHERE status IS NULL OR status = 'active'::homepage_media_status;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_homepage_media_status ON homepage_media(status);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_slot_status ON homepage_media(section, slot_key, status);

-- Create trigger to increment version on update
CREATE OR REPLACE FUNCTION increment_homepage_media_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW IS DISTINCT FROM OLD THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_homepage_media_version ON homepage_media;
CREATE TRIGGER trigger_homepage_media_version
  BEFORE UPDATE ON homepage_media
  FOR EACH ROW
  EXECUTE FUNCTION increment_homepage_media_version();
