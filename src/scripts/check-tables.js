const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('✅ Environment variables loaded from .env.local');
  } catch (error) {
    console.log('⚠️  Could not load .env.local file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const sql = neon(DATABASE_URL);
    
    // Check what session tables exist
    const sessionTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%session%' OR table_name LIKE '%auth%')
      ORDER BY table_name
    `;
    
    console.log('📋 Session-related tables:', sessionTables.map(t => t.table_name));
    
    // Check all tables
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 All tables:', allTables.map(t => t.table_name));
    
    // Check if sessions table has data
    try {
      const sessionsCount = await sql`SELECT COUNT(*) as count FROM sessions`;
      console.log('📊 Sessions table count:', sessionsCount[0].count);
    } catch (error) {
      console.log('❌ Sessions table Last Names not exist:', error.message);
    }
    
    // Check if auth_sessions table has data
    try {
      const authSessionsCount = await sql`SELECT COUNT(*) as count FROM auth_sessions`;
      console.log('📊 Auth_sessions table count:', authSessionsCount[0].count);
    } catch (error) {
      console.log('❌ Auth_sessions table Last Names not exist:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

checkTables().then(() => {
  console.log('🏁 Table check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Table check failed:', error);
  process.exit(1);
});
