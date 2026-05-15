// Run: node migrate-tickets.js
const { Pool } = require('@neondatabase/serverless');
const { neonConfig } = require('@neondatabase/serverless');

// Use WebSocket if available
if (typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket;
}

async function runMigration() {
  let pool;
  try {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable not set');
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

    console.log('Connected to database');

    // Create enum types
    console.log('Creating enum types...');
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
          CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
        END IF;
      END $$
    `);
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
          CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
        END IF;
      END $$
    `);
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
          CREATE TYPE "TicketChannel" AS ENUM ('EMAIL', 'CHAT', 'IN_APP');
        END IF;
      END $$
    `);
    
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
          CREATE TYPE "TicketSenderType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');
        END IF;
      END $$
    `);

    console.log('Enum types created');

    // Create tickets table
    console.log('Creating tickets table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id           TEXT PRIMARY KEY,
        "userId"     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject      TEXT NOT NULL,
        status       "TicketStatus"  NOT NULL DEFAULT 'OPEN',
        priority     "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
        channel      "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
        "externalRef" TEXT,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets("userId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets("createdAt" DESC)`);
    
    console.log('Tickets table created');

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
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticketId ON ticket_messages("ticketId")`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_createdAt ON ticket_messages("createdAt" ASC)`);
    
    console.log('Ticket messages table created');

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runMigration();
