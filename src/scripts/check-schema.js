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

async function checkSchema() {
  const connectionString = getCleanConnectionString();
  if (!connectionString || !connectionString.startsWith("postgresql://")) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(connectionString);
  
  try {
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log("\n📊 Current users table columns:");
    if (result.length === 0) {
      console.log("  ⚠ Table 'users' does not exist");
    } else {
      result.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkSchema();
