require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function fixDatabase() {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Convert pooler URL to direct URL for schema changes
  connectionString = connectionString.replace(/-pooler/g, '');

  const pool = new Pool({ connectionString });
  
  try {
    console.log('Fixing database permissions and schema...\n');

    // 1. Grant SELECT permissions on new homepage content tables
    console.log('1. Granting SELECT permissions on homepage content tables...');
    
    const grantQueries = [
      'GRANT SELECT ON homepage_services TO authenticator;',
      'GRANT SELECT ON homepage_faqs TO authenticator;',
      'GRANT SELECT ON homepage_testimonials TO authenticator;',
      'GRANT SELECT ON navigation_links TO authenticator;',
      'GRANT SELECT ON homepage_media TO authenticator;',
      'GRANT SELECT ON service_status TO authenticator;',
    ];

    for (const query of grantQueries) {
      try {
        await pool.query(query);
        console.log(`  ✓ ${query.split(' ON ')[1].split(' TO')[0]}`);
      } catch (err) {
        if (err.code === '42501') {
          console.log(`  ⚠ Permission already granted or table Last Namesn't exist: ${query.split(' ON ')[1].split(' TO')[0]}`);
        } else {
          console.log(`  ⚠ ${err.message}`);
        }
      }
    }

    // 2. Add missing sort_order column to homepage_media
    console.log('\n2. Adding missing columns to homepage_media...');
    
    try {
      await pool.query(`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;`);
      console.log('  ✓ Added sort_order column');
    } catch (err) {
      if (err.code === '42701') {
        console.log('  ✓ sort_order column already exists');
      } else {
        console.log(`  ⚠ ${err.message}`);
      }
    }

    // 3. Add missing columns to service_status
    console.log('\n3. Adding missing columns to service_status...');
    
    const serviceStatusColumns = [
      { name: 'service_key', type: 'VARCHAR(50)' },
      { name: 'service_name', type: 'VARCHAR(100)' },
      { name: 'display_order', type: 'INTEGER DEFAULT 0' },
      { name: 'is_coming_soon', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'coming_soon_message', type: 'TEXT' },
      { name: 'expected_launch_date', type: 'DATE' },
      { name: 'is_enabled', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'is_maintenance', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'maintenance_message', type: 'TEXT' },
    ];

    for (const col of serviceStatusColumns) {
      try {
        await pool.query(`ALTER TABLE service_status ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`  ✓ Added ${col.name} column`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`  ✓ ${col.name} column already exists`);
        } else {
          console.log(`  ⚠ ${col.name}: ${err.message}`);
        }
      }
    }

    // 4. Verify tables
    console.log('\n4. Verifying tables...');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('homepage_services', 'homepage_faqs', 'homepage_testimonials', 'navigation_links', 'homepage_media', 'service_status')
      ORDER BY table_name
    `);
    
    console.log('  Tables found:');
    tables.rows.forEach(row => {
      console.log(`    - ${row.table_name}`);
    });

    // 5. Check columns
    console.log('\n5. Verifying columns...');
    
    const mediaCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'homepage_media' AND column_name = 'sort_order'
    `);
    console.log(`  homepage_media.sort_order: ${mediaCols.rows.length > 0 ? '✓ exists' : '✗ missing'}`);

    const statusCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'service_status' AND column_name IN ('service_key', 'display_order', 'is_enabled')
      ORDER BY column_name
    `);
    console.log(`  service_status columns: ${statusCols.rows.map(r => r.column_name).join(', ') || 'none'}`);

    console.log('\n✅ Database fix completed!');
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixDatabase();
