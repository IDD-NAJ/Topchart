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

async function testPaymentsAPI() {
  try {
    console.log('🧪 Testing payments API database queries...');
    
    const sql = neon(DATABASE_URL);
    
    // Test the query that payments API uses
    console.log('🔍 Testing session query...');
    
    const testQuery = await sql`
      SELECT s.user_id, u.email, u.first_name, u.last_name
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.expires_at > NOW()
      LIMIT 1
    `;
    
    console.log('✅ Session query successful:', testQuery.length, 'sessions found');
    
    if (testQuery.length > 0) {
      console.log('📋 Sample user data:');
      console.log('   User ID:', testQuery[0].user_id);
      console.log('   Email:', testQuery[0].email);
      console.log('   Name:', `${testQuery[0].first_name} ${testQuery[0].last_name}`);
    }
    
    // Test transactions table structure
    console.log('🔍 Testing transactions table...');
    const transactionColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'transactions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Transactions table columns:');
    transactionColumns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('🎉 Payments API database queries are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing payments API:', error);
  }
}

testPaymentsAPI().then(() => {
  console.log('🏁 Payments API test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Payments API test failed:', error);
  process.exit(1);
});
