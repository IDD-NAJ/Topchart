#!/usr/bin/env node
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || valueParts.length === 0) continue;
    const value = valueParts.join("=").trim();
    process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
  }
}

function getCleanConnectionString() {
  let connectionString = process.env.DATABASE_URL || "";
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) connectionString = postgresMatch[0];
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
  connectionString = connectionString
    .replace(/&&/g, "&")
    .replace(/\?&/g, "?")
    .replace(/[?&]$/, "");
  return connectionString.trim();
}

async function main() {
  loadEnvLocal();
  const connectionString = getCleanConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL not set. Add it to .env.local");
  }
  const sql = neon(connectionString);

  try {
    console.log("📄 Adding role column...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER'`;
    console.log("✅ Role column added");

    console.log("📄 Creating role index...");
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    console.log("✅ Role index created");

    console.log("📄 Adding role constraint...");
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'chk_users_role' AND conrelid = 'public.users'::regclass
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT chk_users_role CHECK (UPPER(role) IN ('USER', 'ADMIN', 'RESELLER'));
        END IF;
      END $$;
    `;
    console.log("✅ Role constraint added");

    const TARGET = {
      id: "d413d8f6-f44a-4cca-96c2-cc8e4a25559b",
      email: "najeebiddrisu79@gmail.com",
    };

    console.log("📄 Promoting admin user...");
    const existing = await sql`
      SELECT id, email, role
      FROM users
      WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
      LIMIT 1
    `;

    if (!existing || existing.length === 0) {
      throw new Error(`User not found for id=${TARGET.id} email=${TARGET.email}.`);
    }

    console.log("📄 Current user:", existing[0]);

    const updated = await sql`
      UPDATE users
      SET role = 'ADMIN'
      WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
      RETURNING id, email, role
    `;

    console.log("✅ Admin user promoted:", updated[0]);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error("Full error:", err);
    throw err;
  }
}

main().catch((err) => {
  console.error("❌ Setup failed:", err?.message || err);
  process.exit(1);
});
