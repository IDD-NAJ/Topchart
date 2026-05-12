#!/usr/bin/env node
/**
 * One-shot setup for homepage media management.
 * Run: node setup-homepage-media.js
 *
 * 1. Creates the `homepage_media` PostgreSQL table + indexes + update trigger
 * 2. Seeds default rows (pointing to local public-folder assets)
 * 3. Creates the `homepage-media` Supabase Storage bucket (public)
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function createTable(pool) {
  const migrationSQL = `
CREATE TABLE IF NOT EXISTS homepage_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(120) NOT NULL,
    asset_type  VARCHAR(20)  NOT NULL CHECK (asset_type IN ('image', 'video')),
    storage_path TEXT        NOT NULL,
    public_url  TEXT        NOT NULL,
    alt_text    TEXT,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_sort
    ON homepage_media(section_key, is_active, sort_order);

CREATE OR REPLACE FUNCTION update_homepage_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_homepage_media_updated_at ON homepage_media;
CREATE TRIGGER trg_homepage_media_updated_at
    BEFORE UPDATE ON homepage_media
    FOR EACH ROW EXECUTE FUNCTION update_homepage_media_updated_at();

INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active)
VALUES
  ('mtn_logo',               'image', 'seed/mtn-logo.svg',                '/images/mtn-logo.svg',               'MTN logo',                            1, TRUE),
  ('telecel_logo',           'image', 'seed/telecel-logo.svg',            '/images/telecel-logo.svg',            'Telecel logo',                        2, TRUE),
  ('airteltigo_logo',        'image', 'seed/airteltigo-logo.svg',         '/images/airteltigo-logo.svg',         'AirtelTigo logo',                     3, TRUE),
  ('developer_community_image','image','seed/technical-partnership.jpg',  '/images/technical-partnership.jpg',  'A user looking at code metrics',       4, TRUE),
  ('hero_background_video',  'image', 'seed/technical-partnership.jpg',   '/images/technical-partnership.jpg',   'Hero section background image',        5, TRUE),
  ('scale_background_video', 'image', 'seed/topchart-way.jpg',            '/images/topchart-way.jpg',            'Scale section background image',       6, TRUE),
  ('faq_hero_background',    'image', 'seed/topchart-way.jpg',            '/images/topchart-way.jpg',            'FAQ hero background image',            7, TRUE),
  ('about_hero_background',  'image', 'seed/topchart-way.jpg',            '/images/topchart-way.jpg',            'About hero background image',          8, TRUE)
ON CONFLICT DO NOTHING;
`;

  console.log('📦 Creating homepage_media table …');
  await pool.query(migrationSQL);
  console.log('✅ Table ready.');

  const { rows } = await pool.query(
    `SELECT section_key, asset_type, is_active FROM homepage_media ORDER BY sort_order`
  );
  console.log(`\n📋 Seeded rows (${rows.length}):`);
  rows.forEach(r => {
    const icon = r.asset_type === 'video' ? '🎬' : '🖼️';
    const status = r.is_active ? '✅' : '⏸️';
    console.log(`  ${icon} ${status} ${r.section_key}`);
  });
}

async function createBucket() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const BUCKET = process.env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || 'homepage-media';

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn('\n⚠️  Supabase env vars not set – skipping bucket creation.');
    console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }

  console.log(`\n🪣 Creating Supabase bucket "${BUCKET}" …`);

  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 104857600,        // 100 MB
      allowed_mime_types: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/ogg',
      ],
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (res.ok) {
    console.log(`✅ Bucket "${BUCKET}" created (public, 100 MB limit).`);
  } else if (body?.error === 'Duplicate' || body?.message?.includes('already exists')) {
    console.log(`ℹ️  Bucket "${BUCKET}" already exists – skipping.`);
  } else {
    console.error(`❌ Bucket creation failed (${res.status}):`, body);
  }
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ No DATABASE_URL found in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    await createTable(pool);
    await createBucket();
    console.log('\n🎉 Homepage media setup complete!');
    console.log('   Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Go to /admin/homepage-media');
    console.log('   3. Upload your hero video and section images.');
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
