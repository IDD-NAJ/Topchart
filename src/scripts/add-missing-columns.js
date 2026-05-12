#!/usr/bin/env node

const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
        }
      }
    }
  }
}

loadEnvLocal();

function getCleanConnectionString() {
  let connectionString = process.env.DATABASE_URL || "";
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
  connectionString = connectionString.replace(/&&/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "");
  return connectionString.trim();
}

async function addMissingColumns() {
  const connectionString = getCleanConnectionString();
  const sql = neon(connectionString);
  
  try {
    console.log("Adding missing columns to users table...\n");
    
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0.00`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    
    console.log("  ✓ Added wallet_balance");
    console.log("  ✓ Added is_verified");
    console.log("  ✓ Added created_at");
    console.log("  ✓ Added updated_at\n");

    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('wallet_balance', 'is_verified', 'created_at', 'updated_at') ORDER BY column_name`;
    
    console.log("Verified columns:");
    cols.forEach(c => console.log(`  - ${c.column_name}`));
    
    console.log("\n✅ Missing columns added successfully!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    process.exit(1);
  }
}

addMissingColumns();
