#!/usr/bin/env node
/**
 * Runs SQL migrations against Neon using DATABASE_URL from .env.local
 */
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");
 
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", "..", ".env.local");
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
 
async function runSQLFile(sql, filePath) {
  const name = path.basename(filePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Skipping missing file: ${name}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  console.log(`📄 Running ${name}`);
  await sql.unsafe(content);
  console.log(`✅ Done ${name}`);
}
 
async function main() {
  loadEnvLocal();
  const connectionString = getCleanConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL not set. Add it to .env.local");
  }
  const sql = neon(connectionString);
  await sql`SELECT 1 as ok`;
 
  const files = [
    path.join(__dirname, "001-create-tables.sql"),
    path.join(__dirname, "002-add-paystack-columns.sql"),
    path.join(__dirname, "002-add-reseller-tables.sql"),
    path.join(__dirname, "003-create-auth-sessions.sql"),
    path.join(__dirname, "003-add-fraud-tables.sql"),
    path.join(__dirname, "004-fix-transactions-user-id.sql"),
    path.join(__dirname, "004-add-tier-tables.sql"),
    path.join(__dirname, "005-reset-transactions-table.sql"),
    path.join(__dirname, "005-add-analytics-tables.sql"),
    path.join(__dirname, "006-fix-transactions-updatedAt.sql"),
    path.join(__dirname, "006-reseller-form-customization.sql"),
    path.join(__dirname, "007-fix-wallets-updatedAt.sql"),
    path.join(__dirname, "008-add-user-role.sql"),
    path.join(__dirname, "009-add-role-constraint.sql"),
    path.join(__dirname, "010-create-content-tables.sql"),
    path.join(__dirname, "011-create-blog-tables.sql"),
    path.join(__dirname, "012-create-faqs-tables.sql"),
    path.join(__dirname, "013-create-press-tables.sql"),
    path.join(__dirname, "015-add-verification-tables.sql"),
    path.join(__dirname, "020-referral-links.sql"),
  ];
 
  for (const f of files) {
    await runSQLFile(sql, f);
  }
}
 
main().catch((err) => {
  console.error("❌ Migration failed:", err?.message || err);
  process.exit(1);
});

