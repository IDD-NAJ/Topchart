const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

async function main() {
  const envFile = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);
  const connectionString = dbUrlMatch ? dbUrlMatch[1].trim() : null;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL not set");
  }
  
  const sql = neon(connectionString);
  
  console.log("Testing user registration...\n");
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPhone = `024${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
  const testPassword = "Test123!@#";
  const firstName = "Test";
  const lastName = "User";
  
  console.log(`Test data:`);
  console.log(`  Email: ${testEmail}`);
  console.log(`  Phone: ${testPhone}`);
  console.log(`  Password: ${testPassword}`);
  
  try {
    const normalizedEmail = testEmail.toLowerCase();
    
    console.log("\n1. Checking if user exists...");
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} OR phone = ${testPhone}
    `;
    if (existingUser.length > 0) {
      console.log("  User already exists, skipping");
      return;
    }
    console.log("  ✓ User does not exist");
    
    console.log("\n2. Hashing password...");
    const passwordHash = await bcrypt.hash(testPassword, 10);
    console.log("  ✓ Password hashed");
    
    console.log("\n3. Inserting user...");
    const userId = uuidv4();
    const newReferralCode = userId.slice(0, 8).toUpperCase();
    const now = new Date().toISOString();
    
    const ROLES = { USER: 'USER' };
    
    const result = await sql`
      INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at)
      VALUES (${userId}, ${normalizedEmail}, ${testPhone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, 0.00, NULL, 0.00, ${now})
      RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
    `;
    
    console.log("  ✓ User inserted successfully");
    console.log(`  User ID: ${result[0].id}`);
    console.log(`  Email: ${result[0].email}`);
    console.log(`  Referral Code: ${result[0].referral_code}`);
    
    console.log("\n4. Creating session...");
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${result[0].id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;
    console.log("  ✓ Session created");
    
    console.log("\n✅ Registration test PASSED");
    
    console.log("\n5. Cleaning up test user...");
    await sql`DELETE FROM auth_sessions WHERE user_id = ${result[0].id}`;
    await sql`DELETE FROM users WHERE id = ${result[0].id}`;
    console.log("  ✓ Test user cleaned up");
    
  } catch (error) {
    console.error("\n❌ Registration test FAILED");
    console.error("Error:", error.message);
    console.error("\nStack trace:", error.stack);
    throw error;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
