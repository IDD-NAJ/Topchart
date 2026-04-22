require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

(async () => {
  try {
    // Update video URLs to use local files that exist
    await pool.query(`
      UPDATE homepage_media
      SET public_url = '/logo.mp4'
      WHERE section_key = 'hero_background_video'
    `);
    console.log('✅ Updated hero_background_video to /logo.mp4');

    await pool.query(`
      UPDATE homepage_media
      SET public_url = '/IMG_7731.MP4'
      WHERE section_key = 'scale_background_video'
    `);
    console.log('✅ Updated scale_background_video to /IMG_7731.MP4');

    // Verify the updates
    const result = await pool.query(`
      SELECT section_key, public_url, is_active
      FROM homepage_media
      WHERE section_key IN ('hero_background_video', 'scale_background_video')
    `);
    console.log('\nCurrent video entries:', result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
