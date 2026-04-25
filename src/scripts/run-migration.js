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

// Read database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('Please make sure your .env.local file contains the DATABASE_URL');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔄 Starting email normalization migration...');
    
    const sql = neon(DATABASE_URL);
    
    // Check if there are any emails that need to be normalized
    const checkResult = await sql`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as needs_normalization
      FROM users
    `;
    
    console.log('📊 Database analysis:', checkResult[0]);
    
    let updatedCount = 0;
    
    if (checkResult[0].needs_normalization > 0) {
      console.log(`🔧 Normalizing ${checkResult[0].needs_normalization} emails...`);
      
      // Normalize all existing emails to lowercase
      const updateResult = await sql`
        UPDATE users 
        SET email = LOWER(email), updated_at = NOW()
        WHERE email != LOWER(email)
        RETURNING id, email
      `;
      
      updatedCount = updateResult.length;
      console.log(`✅ Updated ${updateResult.length} emails to lowercase`);
      
      // Show some examples of changed emails
      console.log('📝 Sample of normalized emails:');
      updateResult.slice(0, 5).forEach(user => {
        console.log(`   ID: ${user.id} -> ${user.email}`);
      });
      if (updateResult.length > 5) {
        console.log(`   ... and ${updateResult.length - 5} more`);
      }
    } else {
      console.log('✅ No emails need normalization');
    }
    
    // Check if constraint already exists
    try {
      const constraintCheck = await sql`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
          AND constraint_name = 'check_email_lowercase'
      `;
      
      if (constraintCheck[0].count === 0) {
        console.log('🔒 Adding email lowercase constraint...');
        
        // Add a check constraint to ensure future emails are stored in lowercase
        await sql`
          ALTER TABLE users 
          ADD CONSTRAINT check_email_lowercase 
          CHECK (email = LOWER(email))
        `;
        
        console.log('✅ Email lowercase constraint added');
      } else {
        console.log('✅ Email lowercase constraint already exists');
      }
    } catch (constraintError) {
      console.log('⚠️  Could not add constraint (may already exist):', constraintError.message);
    }
    
    // Add comments
    try {
      await sql`
        COMMENT ON TABLE users IS 'Users table with case-insensitive email handling'
      `;
      
      await sql`
        COMMENT ON COLUMN users.email IS 'User email address - always stored in lowercase for case-insensitive authentication'
      `;
      
      console.log('📝 Added table and column comments');
    } catch (commentError) {
      console.log('⚠️  Could not add comments:', commentError.message);
    }
    
    // Verify the migration
    const verifyResult = await sql`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as still_uppercase
      FROM users
    `;
    
    console.log('🔍 Migration verification:', verifyResult[0]);
    
    if (verifyResult[0].still_uppercase === '0') {
      console.log('🎉 Migration completed successfully!');
      console.log('✅ All emails are now stored in lowercase');
      console.log('✅ Constraint prevents future uppercase emails');
      console.log('📧 Updated email count:', updatedCount);
    } else {
      console.log('❌ Migration failed - some emails are still uppercase');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().then(() => {
  console.log('🏁 Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
