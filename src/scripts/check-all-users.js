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

async function checkAllUsers() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Checking all users in database...');
    
    // Get all users
    const result = await sql`
      SELECT id, email, first_name, last_name, phone, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    console.log(`📊 Found ${result.length} users in database:`);
    
    if (result.length > 0) {
      result.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.first_name} ${user.last_name}`);
        console.log(`   📱 Phone: ${user.phone}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📅 Created: ${user.created_at}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkAllUsers().then(() => {
  console.log('\n🏁 User check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 User check failed:', error);
  process.exit(1);
});
