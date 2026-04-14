const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const ROLES = { USER: 'USER' };

async function register(formData) {
  const { email, phone, password, firstName, lastName, referralCode } = formData;

  const normalizedEmail = email.toLowerCase();
  
  const sql = neon(getDbUrl());

  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${normalizedEmail} OR phone = ${phone}
  `;
  
  if (existingUser.length > 0) {
    return { success: false, error: "User with this email or phone already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let referredBy = null;
  let referrerResellerId = null;
  if (referralCode) {
    const referrer = await sql`
      SELECT id, user_id, reseller_code FROM reseller_profiles
      WHERE reseller_code = ${referralCode.toUpperCase()}
    `;
    if (referrer.length > 0) {
      referredBy = referrer[0].reseller_code;
      referrerResellerId = referrer[0].id;
    }
  }

  const userId = uuidv4();
  const newReferralCode = userId.slice(0, 8).toUpperCase();
  const now = new Date().toISOString();
  
  try {
    const result = await sql`
      INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
      VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
      RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
    `;

    const user = result[0];

    if (referrerResellerId) {
      try {
        await sql`
          UPDATE reseller_profiles
          SET total_referrals = total_referrals + 1
          WHERE id = ${referrerResellerId}
        `;
        
        await sql`
          UPDATE reseller_referral_links
          SET conversions = conversions + 1
          WHERE reseller_id = ${referrerResellerId}
            AND referral_code = ${referralCode?.toUpperCase()}
        `;
      } catch { }
    }

    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;

    await sql`
      DELETE FROM auth_sessions
      WHERE user_id = ${user.id}
        AND id NOT IN (
          SELECT id FROM auth_sessions
          WHERE user_id = ${user.id}
          ORDER BY created_at DESC
          LIMIT 3
        )
    `;

    return { success: true, user };
  } catch (error) {
    console.error("Registration error details:", error);
    return { success: false, error: error.message || "Failed to create account. Please try again." };
  }
}

function getDbUrl() {
  const envFile = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);
  return dbUrlMatch ? dbUrlMatch[1].trim() : null;
}

async function main() {
  console.log("Testing full registration flow...\n");
  
  const testData = {
    email: `test-${Date.now()}@example.com`,
    phone: `024${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    password: "Test123!@#",
    firstName: "Test",
    lastName: "User",
    referralCode: undefined
  };
  
  console.log("Test data:", testData);
  
  const result = await register(testData);
  
  if (result.success) {
    console.log("\n✅ Registration successful");
    console.log("User:", result.user);
    
    const sql = neon(getDbUrl());
    await sql`DELETE FROM auth_sessions WHERE user_id = ${result.user.id}`;
    await sql`DELETE FROM users WHERE id = ${result.user.id}`;
    console.log("\n✅ Test user cleaned up");
  } else {
    console.log("\n❌ Registration failed");
    console.log("Error:", result.error);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
