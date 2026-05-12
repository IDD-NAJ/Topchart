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

async function debugDatabase() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🔍 Debugging database...');
    
    // Check table constraints
    const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        ccu.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'users' AND tc.table_schema = 'public'
    `;
    
    console.log('🔒 Table constraints:');
    constraints.forEach(constraint => {
      console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type}`);
      if (constraint.check_clause) {
        console.log(`     Check: ${constraint.check_clause}`);
      }
    });
    
    // Try a simple insert to see what fails
    console.log('\n🧪 Testing simple insert...');
    try {
      await sql.unsafe(`
        INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, created_at)
        VALUES ('test-id', 'test@example.com', '+233123456789', 'test-hash', 'Test', 'User', 0.00, true, NOW())
      `);
      console.log('✅ Simple insert successful');
      
      // Clean up test record
      await sql`DELETE FROM users WHERE id = 'test-id'`;
      console.log('🧹 Test record cleaned up');
    } catch (error) {
      console.error('❌ Simple insert failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error debugging database:', error);
    process.exit(1);
  }
}

debugDatabase().then(() => {
  console.log('\n🏁 Database debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database debug failed:', error);
  process.exit(1);
});
