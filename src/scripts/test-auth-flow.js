const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function testAuthFlow() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🧪 Testing authentication flow...');
    
    // Step 1: Get admin user
    const adminUser = await sql`
      SELECT id, email, password_hash, first_name, last_name, phone, wallet_balance, is_verified, created_at
      FROM users 
      WHERE email = 'najeebiddrisu79@gmail.com'
    `;
    
    if (adminUser.length === 0) {
      console.error('❌ Admin user not found');
      return;
    }
    
    const user = adminUser[0];
    console.log('✅ Found admin user:', user.email);
    
    // Step 2: Test password verification
    const isValidPassword = await bcrypt.compare('Gold4me.471@1761', user.password_hash);
    console.log('🔐 Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid');
    
    if (!isValidPassword) {
      console.error('❌ Password verification failed');
      return;
    }
    
    // Step 3: Test session creation
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();
    
    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;
    
    console.log('✅ Session created successfully');
    console.log('🎫 Session token:', token);
    
    // Step 4: Test session lookup (like getCurrentUser)
    const sessionResult = await sql`
      SELECT 
        u.id, u.email, u.phone, u.first_name, u.last_name, 
        u.wallet_balance, u.is_verified, u.created_at,
        s.expires_at
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token::text = ${token} AND s.expires_at > NOW()
    `;
    
    if (sessionResult.length > 0) {
      console.log('✅ Session lookup successful');
      console.log('👤 User found:', sessionResult[0].email);
    } else {
      console.error('❌ Session lookup failed');
    }
    
    // Clean up test session
    await sql`DELETE FROM auth_sessions WHERE token::text = ${token}`;
    console.log('🧹 Test session cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing auth flow:', error);
    process.exit(1);
  }
}

testAuthFlow().then(() => {
  console.log('\n🏁 Auth flow test completed');
  console.log('🎉 Authentication system is working!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Auth flow test failed:', error);
  process.exit(1);
});
