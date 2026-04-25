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

async function recreateUsersTable() {
  const connectionString = getCleanConnectionString();
  const sql = neon(connectionString);
  
  try {
    console.log("🔧 Dropping old users table...\n");
    
    await sql.unsafe(`DROP TABLE IF EXISTS user_sessions CASCADE;`);
    await sql.unsafe(`DROP TABLE IF EXISTS user_profiles CASCADE;`);
    await sql.unsafe(`DROP TABLE IF EXISTS transactions CASCADE;`);
    await sql.unsafe(`DROP TABLE IF EXISTS sessions CASCADE;`);
    await sql.unsafe(`DROP TABLE IF EXISTS users CASCADE;`);
    
    console.log("  ✓ Dropped old tables\n");

    const createTablesSQL = `
      CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
          is_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'airtime', 'data')),
          amount DECIMAL(12, 2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
          reference VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          network VARCHAR(20),
          phone_number VARCHAR(20),
          data_plan VARCHAR(100),
          payment_method VARCHAR(50),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    await sql.unsafe(createTablesSQL);
    console.log("  ✓ Created users table");
    console.log("  ✓ Created sessions table");
    console.log("  ✓ Created transactions table\n");

    const paystackSQL = path.join(__dirname, "002-add-paystack-columns.sql");
    if (fs.existsSync(paystackSQL)) {
      const sqlContent = fs.readFileSync(paystackSQL, "utf-8");
      await sql.unsafe(sqlContent);
      console.log("  ✓ Applied Paystack columns\n");
    }

    const verify = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      AND column_name = 'password_hash';
    `;

    if (verify.length > 0) {
      console.log("✅ Users table created successfully with password_hash column!\n");
    } else {
      console.log("⚠️  Warning: password_hash column not found after creation\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

recreateUsersTable();
