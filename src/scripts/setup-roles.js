#!/usr/bin/env node
/**
 * Setup roles in database and promote admin user
 */
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

  console.log("📄 Setting up role column...");
  await sql.unsafe(fs.readFileSync(path.join(__dirname, "008-add-user-role.sql"), "utf-8"));
  console.log("✅ Role column added");

  console.log("📄 Adding role constraint...");
  await sql.unsafe(fs.readFileSync(path.join(__dirname, "009-add-role-constraint.sql"), "utf-8"));
  console.log("✅ Role constraint added");

  const TARGET = {
    id: "d413d8f6-f44a-4cca-96c2-cc8e4a25559b",
    email: "najeebiddrisu79@gmail.com",
  };

  console.log("📄 Checking if role column exists...");
  const columnCheck = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'role'
  `;
  
  if (columnCheck.length === 0) {
    throw new Error("Role column was not created. Check database connection and permissions.");
  }
  console.log("✅ Role column verified");

  console.log("📄 Promoting admin user...");
  const existing = await sql`
    SELECT id, email
    FROM users
    WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
    LIMIT 1
  `;

  if (!existing || existing.length === 0) {
    throw new Error(`User not found for id=${TARGET.id} email=${TARGET.email}.`);
  }

  const updated = await sql`
    UPDATE users
    SET role = 'ADMIN'
    WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
    RETURNING id, email, role
  `;

  console.log("✅ Admin user promoted:", updated[0]);
}

main().catch((err) => {
  console.error("❌ Setup failed:", err?.message || err);
  process.exit(1);
});
