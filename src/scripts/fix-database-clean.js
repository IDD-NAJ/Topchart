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

async function fixDatabaseSchema() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔧 Fixing database schema...');
    
    // Step 1: Drop problematic enum types
    console.log('🗑️  Dropping problematic UserTier enum...');
    try {
      await sql`DROP TYPE IF EXISTS "UserTier" CASCADE`;
      await sql`DROP TYPE IF EXISTS "UserStatus" CASCADE`;
      console.log('✅ Custom types dropped');
    } catch (error) {
      console.log('⚠️  Could not drop custom types:', error.message);
    }
    
    // Step 2: Drop and recreate users table
    console.log('🗑️  Recreating users table...');
    try {
      await sql`DROP TABLE IF EXISTS users CASCADE`;
      console.log('✅ Users table dropped');
    } catch (error) {
      console.log('⚠️  Could not drop users table:', error.message);
    }
    
    // Step 3: Create clean users table
    console.log('🏗️  Creating clean users table...');
    await sql`CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;
    console.log('✅ Clean users table created');
    
    // Step 4: Create indexes
    console.log('📋 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`;
    console.log('✅ Indexes created');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

async function createAdminAccount() {
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
    
    // Create admin user using individual statements to avoid prepared statement issues
    const userId = '550e8400-e29b-41d4-a7b5-2c7f8b2c6';
    const now = new Date().toISOString();
    
    // Insert user data step by step
    await sql`INSERT INTO users (id) VALUES ('${userId}')`;
    await sql`UPDATE users SET email = 'najeebiddrisu79@gmail.com' WHERE id = '${userId}'`;
    await sql`UPDATE users SET phone = '+23355555555' WHERE id = '${userId}'`;
    await sql`UPDATE users SET password_hash = '${passwordHash}' WHERE id = '${userId}'`;
    await sql`UPDATE users SET first_name = 'Admin' WHERE id = '${userId}'`;
    await sql`UPDATE users SET last_name = 'User' WHERE id = '${userId}'`;
    await sql`UPDATE users SET wallet_balance = 0.00 WHERE id = '${userId}'`;
    await sql`UPDATE users SET is_verified = true WHERE id = '${userId}'`;
    await sql`UPDATE users SET created_at = '${now}' WHERE id = '${userId}'`;
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: najeebiddrisu79@gmail.com');
    console.log('👤 Name: Admin User');
    console.log('📱 Phone: +23355555555');
    console.log('🔐 Password: Gold4me.471@1761');
    console.log('🆔 User ID:', userId);
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting database fix process...');
  
  await fixDatabaseSchema();
  await createAdminAccount();
  
  console.log('🏁 Database fix process completed');
  console.log('🎉 Admin account is ready for use!');
  console.log('');
  console.log('🔑 To access admin dashboard:');
  console.log('   Navigate to: /admin');
  console.log('   Login with:');
  console.log('     Email: najeebiddrisu79@gmail.com');
  console.log('     Password: Gold4me.471@1761');
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database fix process failed:', error);
  process.exit(1);
});
