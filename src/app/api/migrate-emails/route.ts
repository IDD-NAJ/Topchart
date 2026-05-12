import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  try {
    console.log('🔄 Starting email normalization migration...');
    
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
    }
    
    // Check if constraint already exists
    const constraintCheck = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
        AND constraint_name = 'check_email_lowercase'
    `;
    
    let constraintAdded = false;
    
    if (constraintCheck[0].count === 0) {
      console.log('🔒 Adding email lowercase constraint...');
      
      // Add a check constraint to ensure future emails are stored in lowercase
      await sql`
        ALTER TABLE users 
        ADD CONSTRAINT check_email_lowercase 
        CHECK (email = LOWER(email))
      `;
      
      constraintAdded = true;
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
    
    const success = verifyResult[0].still_uppercase === 0;
    
    return NextResponse.json({
      success,
      message: success 
        ? 'Migration completed successfully!' 
        : 'Migration failed - some emails are still uppercase',
      results: {
        emailsUpdated: updatedCount,
        constraintAdded,
        totalUsers: checkResult[0].count,
        emailsNeedingNormalization: checkResult[0].needs_normalization,
        stillUppercase: verifyResult[0].still_uppercase
      }
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error'
    }, { status: 500 });
  }
}
