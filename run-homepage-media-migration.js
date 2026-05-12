// Migration runner for homepage_media table
require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure WebSocket for Neon
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  try {
    const migrationSQL = `
-- Migration: Create homepage_media table for images and videos
-- Created: 2026-04-19

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

-- Insert seed data for default images and videos
INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active) VALUES
('mtn_logo', 'image', 'seed/mtn-logo.svg', '/images/mtn-logo.svg', 'MTN logo', 1, TRUE),
('telecel_logo', 'image', 'seed/telecel-logo.svg', '/images/telecel-logo.svg', 'Telecel logo', 2, TRUE),
('airteltigo_logo', 'image', 'seed/airteltigo-logo.svg', '/images/airteltigo-logo.svg', 'AirtelTigo logo', 3, TRUE),
('developer_community_image', 'image', 'seed/technical-partnership.jpg', '/images/technical-partnership.jpg', 'A user looking at code metrics', 4, TRUE),
('hero_background_video', 'image', 'seed/technical-partnership.jpg', '/images/technical-partnership.jpg', 'Hero section background image', 5, TRUE),
('scale_background_video', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'Scale section background image', 6, TRUE),
('faq_hero_background', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'FAQ hero background image', 7, TRUE),
('about_hero_background', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'About hero background image', 8, TRUE)
ON CONFLICT DO NOTHING;
`;

    console.log('Running migration: 025-create-homepage-media-table.sql...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify table was created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'homepage_media'
    `);
    
    console.log('\n📊 Table status:');
    if (tables.rows.length > 0) {
      console.log(`  - homepage_media: ✅ Created`);
    } else {
      console.log(`  - homepage_media: ❌ Not found`);
    }
    
    // Count records
    const counts = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE asset_type = 'image') as images,
        COUNT(*) FILTER (WHERE asset_type = 'video') as videos
      FROM homepage_media
    `);
    
    console.log('\n📈 Seed data counts:');
    console.log(`  - Total records: ${counts.rows[0].total}`);
    console.log(`  - Images: ${counts.rows[0].images}`);
    console.log(`  - Videos: ${counts.rows[0].videos}`);
    
    // Show section keys
    const sections = await pool.query(`
      SELECT section_key, asset_type, is_active 
      FROM homepage_media 
      ORDER BY sort_order ASC
    `);
    
    console.log('\n📋 Sections configured:');
    sections.rows.forEach(row => {
      const icon = row.asset_type === 'video' ? '🎬' : '🖼️';
      const status = row.is_active ? '✅' : '⏸️';
      console.log(`  ${icon} ${status} ${row.section_key} (${row.asset_type})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
