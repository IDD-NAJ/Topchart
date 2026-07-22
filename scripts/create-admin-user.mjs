import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createAdminUser() {
  try {
    // Hash password: "AdminPass123!"
    const passwordHash = await bcrypt.hash("AdminPass123!", 10);

    // Check if admin user exists
    const existing = await sql`
      SELECT id FROM users WHERE email = 'admin@topchart.local' LIMIT 1
    `;

    if (existing.length > 0) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const result = await sql`
      INSERT INTO users (
        id,
        email,
        phone,
        password_hash,
        first_name,
        last_name,
        role,
        is_verified,
        wallet_balance,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        'admin@topchart.local',
        '+233501234567',
        ${passwordHash},
        'Admin',
        'User',
        'ADMIN',
        true,
        0,
        NOW(),
        NOW()
      )
      RETURNING id, email, role
    `;

    console.log("✓ Admin user created:", result[0]);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
}

createAdminUser();
