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

async function main() {
  console.log('🚀 Starting admin account creation...');
  
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔧 Creating admin account...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('Gold4me.471@1761', 10);
    
    // Create admin user with a single INSERT statement
    const userId = '550e8400-e29b-41d4-a7b5-2c7f8b2c6';
    const now = new Date().toISOString();
    
    await sql.unsafe(`
      INSERT INTO users (
        id, email, phone, password_hash, first_name, last_name, 
        wallet_balance, is_verified, created_at
      ) VALUES (
        '${userId}', 
        'najeebiddrisu79@gmail.com', 
        '+23355555555', 
        '${passwordHash}', 
        'Admin', 
        'User', 
        0.00, 
        true, 
        '${now}'
      )
      RETURNING id, email, first_name, last_name, is_verified
    `);
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: najeebiddrisu79@gmail.com');
    console.log('👤 Name: Admin User');
    console.log('📱 Phone: +23355555555');
    console.log('🔐 Password: Gold4me.471@1761');
    console.log('🆔 User ID:', userId);
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  }
}

main().then(() => {
  console.log('🏁 Admin account creation completed');
  console.log('🎉 Admin account is ready for use!');
  console.log('');
  console.log('🔑 To access admin dashboard:');
  console.log('   Navigate to: /admin');
  console.log('   Login with:');
  console.log('     Email: najeebiddrisu79@gmail.com');
  console.log('     Password: Gold4me.471@1761');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Admin account creation failed:', error);
  process.exit(1);
});
