-- Migration: Normalize homepage_media model for section-driven media management
-- Created: 2026

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_section') THEN
    CREATE TYPE homepage_media_section AS ENUM ('hero', 'header', 'logo', 'banner', 'background', 'footer');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_type') THEN
    CREATE TYPE homepage_media_type AS ENUM ('image', 'video');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_storage_source') THEN
    CREATE TYPE homepage_media_storage_source AS ENUM ('local', 'supabase');
  END IF;
END $$;

ALTER TABLE homepage_media
  ADD COLUMN IF NOT EXISTS section homepage_media_section,
  ADD COLUMN IF NOT EXISTS slot_key TEXT,
  ADD COLUMN IF NOT EXISTS media_type homepage_media_type,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_source homepage_media_storage_source,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER;

UPDATE homepage_media
SET priority = COALESCE(priority, sort_order, 0)
WHERE priority IS NULL OR priority <> COALESCE(priority, sort_order, 0);

UPDATE homepage_media
SET
  media_type = CASE
    WHEN asset_type IN ('image', 'video') THEN asset_type::homepage_media_type
    ELSE 'image'::homepage_media_type
  END,
  file_url = COALESCE(file_url, public_url),
  slot_key = COALESCE(slot_key, section_key)
WHERE media_type IS NULL OR file_url IS NULL OR slot_key IS NULL;

UPDATE homepage_media
SET section = CASE
  WHEN COALESCE(slot_key, section_key) IN ('hero_background_video') THEN 'hero'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('header_logo') THEN 'header'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('mtn_logo', 'telecel_logo', 'airteltigo_logo') THEN 'logo'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('developer_community_image') THEN 'banner'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('scale_background_video') THEN 'background'::homepage_media_section
  ELSE 'footer'::homepage_media_section
END
WHERE section IS NULL;

ALTER TABLE homepage_media
  ALTER COLUMN section SET NOT NULL,
  ALTER COLUMN slot_key SET NOT NULL,
  ALTER COLUMN media_type SET NOT NULL,
  ALTER COLUMN file_url SET NOT NULL,
  ALTER COLUMN priority SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_homepage_media_section ON homepage_media(section);
CREATE INDEX IF NOT EXISTS idx_homepage_media_is_active ON homepage_media(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_priority ON homepage_media(section, is_active, priority);
