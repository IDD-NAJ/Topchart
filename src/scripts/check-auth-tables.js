#!/usr/bin/env node

const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
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
  if (!connectionString || !connectionString.startsWith("postgresql://")) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(connectionString);
  const tables = ["users", "auth_sessions", "sessions", "transactions"];

  for (const table of tables) {
    const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position;
    `;

    console.log(`\n=== ${table} ===`);
    if (cols.length === 0) {
      console.log("(missing)");
      continue;
    }
    for (const c of cols) {
      console.log(`${c.column_name} :: ${c.data_type}`);
    }
  }
}

main().catch((e) => {
  console.error("❌ Error:", e?.message || e);
  process.exit(1);
});

