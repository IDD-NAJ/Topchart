#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script runs the SQL migration files to set up the database schema.
 * Run with: npx tsx scripts/setup-database.ts
 * Or: npm run db:setup (if added to package.json)
 */

import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

function getCleanConnectionString(): string {
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

async function runSQLFile(filePath: string, sql: any) {
  console.log(`\n📄 Running: ${path.basename(filePath)}`);
  
  const sqlContent = fs.readFileSync(filePath, "utf-8");
  
  // Split by semicolons, but keep functions and triggers together
  // Remove comments and empty lines
  const statements = sqlContent
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))
    .filter((stmt) => stmt !== "");

  for (const statement of statements) {
    if (statement.trim().length === 0) continue;
    
    try {
      await sql.transaction([sql`${statement}`]);
      console.log(`  ✓ Executed statement`);
    } catch (error: unknown) {
      const err = error as Error;
      // Ignore "already exists" errors as they're expected with IF NOT EXISTS
      if (err.message && (
        err.message.includes("already exists") ||
        err.message.includes("duplicate") ||
        err.message.includes("relation already exists")
      )) {
        console.log(`  ⚠ Skipped (already exists)`);
      } else {
        console.error(`  ✗ Error: ${err.message}`);
        throw error;
      }
    }
  }
  
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
    await sql`SELECT 1`;
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

  } catch (error: unknown) {
    const err = error as Error;
    console.error("\n❌ Database setup failed:");
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

setupDatabase();
