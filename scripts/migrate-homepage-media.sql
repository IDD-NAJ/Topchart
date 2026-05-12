-- Migration: Add homepage_media columns for full DB sync
-- Run in Neon SQL Editor. No DO $$ blocks - each statement is standalone.

-- STEP 1: Create enum types (IF NOT EXISTS is not supported for CREATE TYPE in all PG versions,
-- so if a type already exists, just skip that line and move to the next)
CREATE TYPE homepage_media_section AS ENUM ('hero', 'header', 'logo', 'banner', 'background', 'footer');

CREATE TYPE homepage_media_type AS ENUM ('image', 'video');

CREATE TYPE homepage_media_storage_source AS ENUM ('local', 'supabase');

CREATE TYPE homepage_media_status AS ENUM ('active', 'inactive', 'archived');

-- STEP 2: Add missing columns
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS section homepage_media_section;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS slot_key TEXT;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS media_type homepage_media_type;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS storage_source homepage_media_storage_source;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS status homepage_media_status DEFAULT 'active';
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2);
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- STEP 3: Backfill existing rows
UPDATE homepage_media SET slot_key = COALESCE(slot_key, section_key) WHERE slot_key IS NULL;

UPDATE homepage_media SET media_type = CASE WHEN asset_type IN ('image', 'video') THEN asset_type::homepage_media_type ELSE 'image'::homepage_media_type END WHERE media_type IS NULL;

UPDATE homepage_media SET file_url = COALESCE(file_url, public_url) WHERE file_url IS NULL;

UPDATE homepage_media SET priority = COALESCE(priority, sort_order, 0) WHERE priority IS NULL OR priority = 0;

UPDATE homepage_media SET status = CASE WHEN is_active = true THEN 'active'::homepage_media_status ELSE 'inactive'::homepage_media_status END WHERE status IS NULL;

UPDATE homepage_media SET section = CASE
  WHEN COALESCE(slot_key, section_key) IN ('hero_background_video', 'hero_background', 'hero_overlay_video', 'faq_hero_background', 'about_hero_background') THEN 'hero'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('header_logo', 'header_background') THEN 'header'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('mtn_logo', 'telecel_logo', 'airteltigo_logo', 'network_mtn_logo', 'network_telecel_logo', 'network_airteltigo_logo', 'main_logo', 'partner_logos') THEN 'logo'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('developer_community_image', 'promo_banner_1', 'promo_banner_2') THEN 'banner'::homepage_media_section
  WHEN COALESCE(slot_key, section_key) IN ('scale_background_video', 'section_bg_1', 'section_bg_2') THEN 'background'::homepage_media_section
  ELSE 'footer'::homepage_media_section
END WHERE section IS NULL;

-- STEP 4: Set NOT NULL constraints
ALTER TABLE homepage_media ALTER COLUMN section SET NOT NULL;
ALTER TABLE homepage_media ALTER COLUMN slot_key SET NOT NULL;
ALTER TABLE homepage_media ALTER COLUMN media_type SET NOT NULL;
ALTER TABLE homepage_media ALTER COLUMN file_url SET NOT NULL;

-- STEP 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_media_section ON homepage_media(section);
CREATE INDEX IF NOT EXISTS idx_homepage_media_is_active ON homepage_media(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_priority ON homepage_media(section, is_active, priority);
CREATE INDEX IF NOT EXISTS idx_homepage_media_status ON homepage_media(status);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section_slot_status ON homepage_media(section, slot_key, status);

-- STEP 6: Verify
SELECT count(*) as total_rows, count(section) as with_section, count(slot_key) as with_slot_key FROM homepage_media;
