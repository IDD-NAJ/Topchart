/**
 * Promote a specific user to ADMIN in the database.
 *
 * Usage:
 *   node scripts/promote-user-to-admin.js
 *
 * Safety:
 * - Targets by BOTH id and email.
 * - Only updates if the user exists.
 */
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");
 
const TARGET = {
  id: "d413d8f6-f44a-4cca-96c2-cc8e4a25559b",
  email: "najeebiddrisu79@gmail.com",
};

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
 
function getDbUrl() {
  loadEnvLocal();
  const url = getCleanConnectionString();
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }
  return url;
}
 
async function main() {
  const sql = neon(getDbUrl());
 
  const existing = await sql`
    SELECT id, email, role
    FROM users
    WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
    LIMIT 1
  `;
 
  if (!existing || existing.length === 0) {
    throw new Error(
      `User not found for id=${TARGET.id} email=${TARGET.email}.`
    );
  }
 
  const updated = await sql`
    UPDATE users
    SET role = 'ADMIN'
    WHERE id::text = ${TARGET.id} AND LOWER(email) = ${TARGET.email.toLowerCase()}
    RETURNING id, email, role
  `;
 
  console.log("Updated user role:", updated[0]);
}
 
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

