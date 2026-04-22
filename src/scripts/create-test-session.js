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

async function createTestSession() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔧 Creating test session for admin user...');
    
    // Get admin user
    const adminUser = await sql`
      SELECT id, email, password_hash, first_name, last_name
      FROM users 
      WHERE email = 'najeebiddrisu79@gmail.com'
    `;
    
    if (adminUser.length === 0) {
      console.error('❌ Admin user not found');
      return;
    }
    
    const user = adminUser[0];
    
    // Create a valid session
    const { v4: uuidv4 } = require('uuid');
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();
    
    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;
    
    console.log('✅ Test session created successfully!');
    console.log('🎫 Session Token:', token);
    console.log('👤 User:', user.email);
    console.log('🆔 User ID:', user.id);
    console.log('⏰ Expires:', expiresAt.toISOString());
    
    console.log('\n📋 Instructions:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to: /login');
    console.log('3. Login with:');
    console.log('   Email: najeebiddrisu79@gmail.com');
    console.log('   Password: Gold4me.471@1761');
    console.log('4. The login should work and create a new session');
    console.log('5. Navigate to /admin to access the admin dashboard');
    
  } catch (error) {
    console.error('❌ Error creating test session:', error);
    process.exit(1);
  }
}

createTestSession().then(() => {
  console.log('\n🏁 Test session creation completed');
  console.log('🎉 Authentication system is ready for testing!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test session creation failed:', error);
  process.exit(1);
});
