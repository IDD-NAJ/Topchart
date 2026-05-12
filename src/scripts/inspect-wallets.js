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

  const cols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='wallets'
    ORDER BY ordinal_position
  `;
  console.log("wallets columns:");
  console.log(JSON.stringify(cols, null, 2));

  const rows = await sql`SELECT * FROM wallets LIMIT 5`;
  console.log("\nwallets sample rows:");
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error("inspect-wallets error:", err);
  process.exit(1);
});

