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
  const cs = getCleanConnectionString();
  if (!cs) throw new Error("DATABASE_URL not set");
  const sql = neon(cs);

  const fks = await sql`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'transactions'
    ORDER BY tc.constraint_name, kcu.ordinal_position
  `;

  const notNullCols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='transactions'
      AND is_nullable='NO'
    ORDER BY ordinal_position
  `;

  console.log("Foreign keys on transactions:");
  console.log(JSON.stringify(fks, null, 2));
  console.log("\nNOT NULL columns on transactions:");
  console.log(JSON.stringify(notNullCols, null, 2));
}

main().catch((err) => {
  console.error("inspect-transactions-constraints error:", err);
  process.exit(1);
});

