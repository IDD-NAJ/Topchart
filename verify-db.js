require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function verifyDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  try {
    console.log('=== Database Verification ===\n');

    // 1. Check tables exist
    console.log('1. Tables:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('homepage_services', 'homepage_faqs', 'homepage_testimonials', 'navigation_links', 'homepage_media', 'service_status')
      ORDER BY table_name
    `);
    tables.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));

    // 2. Test SELECT on each table
    console.log('\n2. SELECT permissions:');
    
    const testQueries = [
      { name: 'homepage_services', query: 'SELECT COUNT(*) FROM homepage_services' },
      { name: 'homepage_faqs', query: 'SELECT COUNT(*) FROM homepage_faqs' },
      { name: 'homepage_testimonials', query: 'SELECT COUNT(*) FROM homepage_testimonials' },
      { name: 'navigation_links', query: 'SELECT COUNT(*) FROM navigation_links' },
      { name: 'homepage_media', query: 'SELECT COUNT(*) FROM homepage_media' },
      { name: 'service_status', query: 'SELECT COUNT(*) FROM service_status' },
    ];

    for (const test of testQueries) {
      try {
        const result = await pool.query(test.query);
        console.log(`   ✓ ${test.name}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ✗ ${test.name}: ${err.message}`);
      }
    }

    // 3. Check columns
    console.log('\n3. Column checks:');
    
    const mediaCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'homepage_media' ORDER BY column_name
    `);
    const hasSortOrder = mediaCols.rows.some(r => r.column_name === 'sort_order');
    console.log(`   homepage_media.sort_order: ${hasSortOrder ? '✓ exists' : '✗ MISSING'}`);

    const statusCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'service_status' ORDER BY column_name
    `);
    const hasServiceKey = statusCols.rows.some(r => r.column_name === 'service_key');
    console.log(`   service_status.service_key: ${hasServiceKey ? '✓ exists' : '✗ MISSING'}`);

    // 4. Test API simulation
    console.log('\n4. API simulation:');
    
    try {
      const nav = await pool.query('SELECT id, label, href, description, icon, priority FROM navigation_links WHERE is_active = TRUE ORDER BY priority ASC');
      console.log(`   ✓ Navigation API: ${nav.rows.length} links`);
    } catch (err) {
      console.log(`   ✗ Navigation API: ${err.message}`);
    }

    try {
      const services = await pool.query('SELECT id, title, description, href, label, icon FROM homepage_services WHERE is_active = TRUE ORDER BY priority ASC');
      console.log(`   ✓ Services API: ${services.rows.length} services`);
    } catch (err) {
      console.log(`   ✗ Services API: ${err.message}`);
    }

    console.log('\n=== Verification Complete ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
