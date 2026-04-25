#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script runs the SQL migration files to set up the database schema.
 * Run with: node scripts/setup-database.js
 */

const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
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

// Load environment variables
loadEnvLocal();

function getCleanConnectionString() {
  let connectionString = process.env.DATABASE_URL || "";
  
  // Remove 'psql' prefix and everything before the actual URL
  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }
  
  // Remove channel_binding parameter as it can cause issues
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, "");
  
  // Clean up any double && or trailing ? or &
  connectionString = connectionString.replace(/&&/g, "&").replace(/\?&/g, "?").replace(/[?&]$/, "");
  
  return connectionString.trim();
}

async function executeSQL(sqlContent, sql) {
  // Split SQL by semicolons, but handle multi-line statements carefully
  // This regex splits on semicolons that are followed by whitespace/newline
  // but not inside function definitions (between $$ markers)
  const statements = [];
  let currentStatement = "";
  let inFunction = false;
  let dollarQuote = null;
  
  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const nextTwo = sqlContent.substring(i, i + 2);
    
    // Check for dollar quoting ($$)
    if (nextTwo === "$$" && dollarQuote === null) {
      dollarQuote = "";
      inFunction = true;
      currentStatement += char;
      i++; // Skip next char
      currentStatement += sqlContent[i];
      continue;
    }
    
    if (inFunction && nextTwo === "$$") {
      dollarQuote = null;
      inFunction = false;
      currentStatement += char;
      i++; // Skip next char
      currentStatement += sqlContent[i];
      continue;
    }
    
    currentStatement += char;
    
    // Split on semicolon only if not in function
    if (char === ";" && !inFunction) {
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0 && !trimmed.startsWith("--")) {
        statements.push(trimmed);
      }
      currentStatement = "";
    }
  }
  
  // Add remaining statement if any
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  for (const statement of statements) {
    const cleaned = statement.replace(/--.*$/gm, "").trim();
    if (cleaned.length === 0) continue;
    
    try {
      // Execute raw SQL using Neon's unsafe method
      await sql.unsafe(cleaned);
    } catch (error) {
      // Ignore "already exists" errors as they're expected with IF NOT EXISTS
      if (
        error.message &&
        (error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("relation already exists") ||
          error.code === "42P07" ||
          error.code === "42710") // PostgreSQL error codes
      ) {
        // These are expected, skip silently
        continue;
      }
      console.error(`Error executing statement: ${error.message}`);
      console.error(`Statement: ${cleaned.substring(0, 150)}...`);
      throw error;
    }
  }
}

async function runSQLFile(filePath, sql) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`);
  
  const sqlContent = fs.readFileSync(filePath, "utf-8");
  
  // Always execute SQL statement by statement for better error handling
  await executeSQL(sqlContent, sql);
  console.log(`  ✅ Completed: ${path.basename(filePath)}`);
}

async function setupDatabase() {
  console.log("🚀 Starting database setup...\n");

  const connectionString = getCleanConnectionString();
  
  if (!connectionString || !connectionString.startsWith("postgresql://")) {
    console.error("❌ Error: DATABASE_URL environment variable is not set or invalid.");
    console.error("   Please set it in your .env.local file.");
    process.exit(1);
  }

  try {
    const sql = neon(connectionString);
    
    // Test connection
    console.log("🔌 Testing database connection...");
    await sql`SELECT 1 as test`;
    console.log("  ✓ Connected successfully\n");

    // Get SQL files in order
    const sqlFiles = [
      path.join(__dirname, "001-create-tables.sql"),
      path.join(__dirname, "002-add-paystack-columns.sql"),
    ];

    for (const sqlFile of sqlFiles) {
      if (fs.existsSync(sqlFile)) {
        await runSQLFile(sqlFile, sql);
      } else {
        console.warn(`⚠ Warning: File not found: ${sqlFile}`);
      }
    }

    console.log("\n✅ Database setup completed successfully!");
    console.log("\n📊 Tables created:");
    console.log("   - users");
    console.log("   - sessions");
    console.log("   - transactions");
    console.log("   - payment_logs");
    console.log("\n🎉 Your database is ready to use!\n");

  } catch (error) {
    console.error("\n❌ Database setup failed:");
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`   ${error.stack}`);
    }
    process.exit(1);
  }
}

setupDatabase();
