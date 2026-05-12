const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '..', '.env');
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
    console.log('⚠️  Could not load .env file:', error.message);
  }
}

async function testAPIEndpoints() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🧪 Testing API endpoint logic...');
    
    // Test 1: getCurrentUser logic (without session)
    console.log('\n🔍 Test 1: getCurrentUser without session');
    const result1 = await sql`
      SELECT 
        u.id, u.email, u.phone, u.first_name, u.last_name, 
        u.wallet_balance, u.is_verified, u.created_at,
        s.expires_at
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token::text = 'invalid-token' AND s.expires_at > NOW()
    `;
    
    console.log('Result:', result1.length === 0 ? '✅ Correctly returns null for invalid token' : '❌ Unexpected result');
    
    // Test 2: Login logic
    console.log('\n🔍 Test 2: Login logic');
    const loginResult = await sql`
      SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, created_at
      FROM users 
      WHERE email = 'najeebiddrisu79@gmail.com'
    `;
    
    if (loginResult.length > 0) {
      console.log('✅ User found for login');
      console.log('📧 Email:', loginResult[0].email);
      console.log('👤 Name:', `${loginResult[0].first_name} ${loginResult[0].last_name}`);
    } else {
      console.log('❌ User not found for login');
    }
    
    // Test 3: Check auth_sessions table structure
    console.log('\n🔍 Test 3: Check auth_sessions table');
    const sessionColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'auth_sessions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 auth_sessions table columns:');
    sessionColumns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable ? '(nullable)' : '(not null)'}`);
    });
    
    // Test 4: Check if there are any existing sessions
    console.log('\n🔍 Test 4: Check existing sessions');
    const existingSessions = await sql`
      SELECT COUNT(*) as count FROM auth_sessions
    `;
    
    console.log('📊 Existing sessions count:', existingSessions[0].count);
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
    process.exit(1);
  }
}

testAPIEndpoints().then(() => {
  console.log('\n🏁 API endpoint testing completed');
  console.log('🎉 Ready to identify authentication issues!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 API endpoint testing failed:', error);
  process.exit(1);
});
