import { sql } from '../lib/db';

async function runMigration() {
  try {
    console.log('🔄 Starting email normalization migration...');
    
    // Check if there are any emails that need to be normalized
    const checkResult = await sql`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as needs_normalization
      FROM users
    `;
    
    console.log('📊 Database analysis:', checkResult[0]);
    
    if (checkResult[0].needs_normalization === 0) {
      console.log('✅ No emails need normalization. Checking constraint...');
    } else {
      console.log(`🔧 Normalizing ${checkResult[0].needs_normalization} emails...`);
      
      // Normalize all existing emails to lowercase
      const updateResult = await sql`
        UPDATE users 
        SET email = LOWER(email), updated_at = NOW()
        WHERE email != LOWER(email)
        RETURNING id, email
      `;
      
      console.log(`✅ Updated ${updateResult.length} emails to lowercase`);
    }
    
    // Check if constraint already exists
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
    
    // Add comments
    await sql`
      COMMENT ON TABLE users IS 'Users table with case-insensitive email handling'
    `;
    
    await sql`
      COMMENT ON COLUMN users.email IS 'User email address - always stored in lowercase for case-insensitive authentication'
    `;
    
    console.log('📝 Added table and column comments');
    
    // Verify the migration
    const verifyResult = await sql`
      SELECT COUNT(*) as count, 
             COUNT(CASE WHEN email != LOWER(email) THEN 1 END) as still_uppercase
      FROM users
    `;
    
    console.log('🔍 Migration verification:', verifyResult[0]);
    
    if (verifyResult[0].still_uppercase === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('✅ All emails are now stored in lowercase');
      console.log('✅ Constraint prevents future uppercase emails');
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
