// This script will help us test the admin login and then test the config saving
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
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

async function checkAdminUser() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Checking admin user...');
    
    // Check if the admin user exists and has the right role
    const adminUser = await sql`
      SELECT id, email, first_name, last_name, role, is_verified 
      FROM users 
      WHERE email = 'najeebiddrisu79@gmail.com'
    `;
    
    if (adminUser.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser[0]);
    
    // Check if user has admin role
    const user = adminUser[0];
    if (user.role !== 'ADMIN') {
      console.log('⚠️  User is not ADMIN, current role:', user.role);
      console.log('🔧 Updating user role to ADMIN...');
      
      await sql`
        UPDATE users SET role = 'ADMIN' WHERE email = 'najeebiddrisu79@gmail.com'
      `;
      
      console.log('✅ User role updated to ADMIN');
    } else {
      console.log('✅ User already has ADMIN role');
    }
    
    // Check if there are any existing sessions
    const sessions = await sql`
      SELECT * FROM auth_sessions 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    console.log('📋 Recent sessions:', sessions.length);
    
    if (sessions.length > 0) {
      console.log('✅ Found existing sessions');
      sessions.forEach((session, index) => {
        console.log(`   Session ${index + 1}: Created ${session.created_at}, Expires ${session.expires_at}`);
      });
    } else {
      console.log('ℹ️  No existing sessions found');
    }
    
    console.log('\n🎯 Ready for testing!');
    console.log('📧 Admin email: najeebiddrisu79@gmail.com');
    console.log('🔑 Admin password: Gold4me.471@1761');
    console.log('🌐 Admin login URL: http://localhost:3000/admin/login');
    console.log('⚙️  Admin config URL: http://localhost:3000/admin/reseller-form-config');
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
}

checkAdminUser().then(() => {
  console.log('\n🏁 Admin user check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Admin user check failed:', error);
  process.exit(1);
});
