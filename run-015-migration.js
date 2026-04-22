require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');

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
    const migrationSQL = fs.readFileSync('./src/lib/db/migrations/015_enhance_homepage_media.sql', 'utf8');
    
    console.log('Running migration: 015_enhance_homepage_media.sql...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify columns were added
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'homepage_media' 
      AND column_name IN ('storage_source', 'file_name', 'mime_type', 'file_size', 'priority')
    `);
    
    console.log('\n📊 Columns in table:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
