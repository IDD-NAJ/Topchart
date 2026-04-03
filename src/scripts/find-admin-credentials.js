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

async function findAdminCredentials() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Looking for admin credentials in database...');
    
    // Find admin user
    const result = await sql`
      SELECT id, email, first_name, last_name, phone, created_at 
      FROM users 
      WHERE email = 'najeebiddrisu79@gmail.com'
    `;
    
    if (result.length > 0) {
      const admin = result[0];
      console.log('✅ Found admin credentials:');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', `${admin.first_name} ${admin.last_name}`);
      console.log('📱 Phone:', admin.phone);
      console.log('🆔 User ID:', admin.id);
      console.log('📅 Created:', admin.created_at);
      console.log('');
      console.log('🔑 To login, use:');
      console.log('   Email: najeebiddrisu79@gmail.com');
      console.log('   Password: Gold4me.471@1761');
      console.log('   Navigate to: /admin');
    } else {
      console.log('❌ Admin user not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error finding admin credentials:', error);
    process.exit(1);
  }
}

findAdminCredentials().then(() => {
  console.log('🏁 Admin credentials lookup completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Admin credentials lookup failed:', error);
  process.exit(1);
});
