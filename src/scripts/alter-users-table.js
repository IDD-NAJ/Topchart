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

async function alterUsersTable() {
  const connectionString = getCleanConnectionString();
  const sql = neon(connectionString);
  
  try {
    console.log("🔧 Altering users table to add required columns...\n");
    
    const alterStatements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0.00`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    ];

    for (const stmt of alterStatements) {
      try {
        await sql.unsafe(stmt);
      } catch (e) {
        console.log(`  ⚠ Skipped: ${e.message}`);
      }
    }

    console.log("  ✓ Added required columns\n");

    const verify = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      AND column_name IN ('password_hash', 'first_name', 'last_name')
      ORDER BY column_name;
    `;

    console.log("✅ Verification - Found columns:");
    verify.forEach(col => console.log(`  - ${col.column_name}`));

    if (verify.length >= 3) {
      console.log("\n✅ Users table updated successfully!\n");
    } else {
      console.log("\n⚠️  Some columns may still be missing\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

alterUsersTable();
