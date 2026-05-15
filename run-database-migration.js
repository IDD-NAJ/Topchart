// Run: node run-database-migration.js
// This script will create all necessary tables for the tickets system

const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const { Pool } = require('@neondatabase/serverless');

async function runMigration() {
  let pool;
  try {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable not set. Please set it in .env.local');
    }

    // Clean connection string
    let cleanConnection = connectionString;
    const postgresMatch = cleanConnection.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
    if (postgresMatch) {
      cleanConnection = postgresMatch[0];
    }
    cleanConnection = cleanConnection.replace(/[&?]channel_binding=[^&]*/g, '');
    cleanConnection = cleanConnection.replace(/[&?]pooler_timeout=[^&]*/g, '');
    cleanConnection = cleanConnection.replace(/&&/g, '&').replace(/\?&/g, '?').replace(/[?&]$/, '');
    cleanConnection = cleanConnection.trim();

    pool = new Pool({ 
      connectionString: cleanConnection,
      max: 5,
    });

    console.log('✅ Connected to database');

    // Check if users table exists, create if not
    console.log('Checking users table...');
    const usersTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!usersTableCheck.rows[0].exists) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL UNIQUE,
          first_name TEXT,
          last_name TEXT,
          wallet_balance NUMERIC(12,2) DEFAULT 0,
          is_verified BOOLEAN DEFAULT false,
          role TEXT DEFAULT 'user',
          referral_code TEXT UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      console.log('✅ users table created');
    } else {
      console.log('✅ users table exists');
      // Check if users table has id as UUID
      const columnCheck = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id'
      `);
      if (columnCheck.rows.length > 0 && columnCheck.rows[0].data_type !== 'uuid') {
        console.log('⚠️  users.id is not UUID type, recreating tickets table with TEXT userId');
        // Drop existing tables if they exist
        await pool.query(`DROP TABLE IF EXISTS ticket_messages CASCADE`);
        await pool.query(`DROP TABLE IF EXISTS tickets CASCADE`);
        
        // Create tickets table with TEXT userId to match users table
        await pool.query(`
          CREATE TABLE tickets (
            id            TEXT PRIMARY KEY,
            "userId"      TEXT NOT NULL,
            subject       TEXT NOT NULL,
            category      TEXT NOT NULL DEFAULT 'General',
            status        "TicketStatus"   NOT NULL DEFAULT 'OPEN',
            priority      "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
            channel       "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
            "externalRef" TEXT,
            "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        console.log('✅ tickets table created (with TEXT userId)');
        await pool.query(`CREATE INDEX idx_tickets_userId ON tickets("userId")`);
        await pool.query(`CREATE INDEX idx_tickets_status ON tickets(status)`);
        await pool.query(`CREATE INDEX idx_tickets_createdAt ON tickets("createdAt" DESC)`);
        
        // Create ticket_messages table
        await pool.query(`
          CREATE TABLE ticket_messages (
            id           TEXT PRIMARY KEY,
            "ticketId"   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            "senderType" "TicketSenderType" NOT NULL DEFAULT 'USER',
            body         TEXT NOT NULL,
            attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
            "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        console.log('✅ ticket_messages table created');
        await pool.query(`CREATE INDEX idx_ticket_messages_ticketId ON ticket_messages("ticketId")`);
        await pool.query(`CREATE INDEX idx_ticket_messages_createdAt ON ticket_messages("createdAt" ASC)`);
        
        console.log('\n✅ Migration completed successfully!');
        console.log('⚠️  Note: tickets table recreated with TEXT userId to match users table');
        return;
      }
    }

    // Create enum types
    console.log('Creating enum types...');
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
          CREATE TYPE "TicketStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
        END IF;
      END $$
    `);
    console.log('✅ TicketStatus enum created');
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
          CREATE TYPE "TicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
        END IF;
      END $$
    `);
    console.log('✅ TicketPriority enum created');
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
          CREATE TYPE "TicketChannel" AS ENUM ('EMAIL','CHAT','IN_APP');
        END IF;
      END $$
    `);
    console.log('✅ TicketChannel enum created');
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
          CREATE TYPE "TicketSenderType" AS ENUM ('USER','ADMIN','SYSTEM');
        END IF;
      END $$
    `);
    console.log('✅ TicketSenderType enum created');

    // Create tickets table
    console.log('Creating tickets table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id            TEXT PRIMARY KEY,
        "userId"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject       TEXT NOT NULL,
        category      TEXT NOT NULL DEFAULT 'General',
        status        "TicketStatus"   NOT NULL DEFAULT 'OPEN',
        priority      "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
        channel       "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
        "externalRef" TEXT,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ tickets table created');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets("userId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets("createdAt" DESC)`);

    // Create ticket_messages table
    console.log('Creating ticket_messages table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id           TEXT PRIMARY KEY,
        "ticketId"   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        "senderType" "TicketSenderType" NOT NULL DEFAULT 'USER',
        body         TEXT NOT NULL,
        attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ ticket_messages table created');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticketId ON ticket_messages("ticketId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_createdAt ON ticket_messages("createdAt" ASC)`);

    console.log('\n✅ Migration completed successfully!');
    console.log('All tables and indexes are ready for the tickets system.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === '3D000') {
      console.error('\n⚠️  Database does not exist. Please create the database first.');
    }
    if (error.code === '28P01') {
      console.error('\n⚠️  Relation "users" does not exist. Please run the main database migration first.');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runMigration();
