require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function checkTables() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('homepage_services', 'homepage_faqs', 'homepage_testimonials', 'navigation_links')
      ORDER BY table_name
    `);
    
    console.log('Homepage content tables:');
    if (result.rows.length === 0) {
      console.log('  None found - tables need to be created');
    } else {
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
