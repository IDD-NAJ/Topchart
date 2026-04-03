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

async function directCheck() {
  const connectionString = getCleanConnectionString();
  const sql = neon(connectionString);
  
  try {
    // Try to add the column directly
    console.log("Adding password_hash column...\n");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`;
    console.log("  ✓ Added columns\n");
    
    // Now check
    const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name`;
    console.log("All columns in users table:");
    cols.forEach(c => console.log(`  - ${c.column_name}`));
    
    const hasPasswordHash = cols.some(c => c.column_name === 'password_hash');
    console.log(`\npassword_hash exists: ${hasPasswordHash}`);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) console.error("Code:", error.code);
  }
}

directCheck();
