const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
    
    console.log('✅ Environment variables loaded');
  } catch (error) {
    console.log('⚠️  Could not load .env.local file:', error.message);
  }
}

async function checkDatabaseStructure() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Checking database structure...');
    
    // Check users table structure
    const usersTable = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Users table columns:');
    usersTable.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable ? '(nullable)' : '(not null)'} Default: ${col.column_default || 'NULL'}`);
    });
    
    // Check for any constraints
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' AND table_schema = 'public'
    `;
    
    console.log('🔒 Users table constraints:');
    constraints.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    // Check existing admin users
    const adminUsers = await sql`
      SELECT id, email, first_name, last_name, created_at
      FROM users 
      WHERE email ILIKE '%admin%'
    `;
    
    console.log('👥 Existing admin-like users:');
    adminUsers.forEach(user => {
      console.log(`   ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    process.exit(1);
  }
}

checkDatabaseStructure().then(() => {
  console.log('🏁 Database structure check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database structure check failed:', error);
  process.exit(1);
});
