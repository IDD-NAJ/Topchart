/**
 * Run the auth sessions composite index migration
 * This script adds a composite index on auth_sessions(token, expires_at) 
 * to optimize session lookup queries
 */

import { neon } from '@neondatabase/serverless';

function getCleanConnectionString() {
  const rawConnection =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_URL ||
    '';
  let connectionString = rawConnection;

  const postgresMatch = connectionString.match(/postgres(?:ql)?:\/\/[^'"\s]+/);
  if (postgresMatch) {
    connectionString = postgresMatch[0];
  }

  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, '');
  connectionString = connectionString.replace(/[&?]pooler_timeout=[^&]*/g, '');
  connectionString = connectionString.replace(/&&/g, '&').replace(/\?&/g, '?').replace(/[?&]$/, '');

  return connectionString.trim();
}

async function runMigration() {
  const connectionString = getCleanConnectionString();
  
  if (!connectionString || !connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    console.error('❌ Database not configured.');
    console.error('Please set DATABASE_URL environment variable in .env.local file.');
    console.error('Example: DATABASE_URL=postgresql://username:password@hostname/database');
    console.error('Get your connection string from your Neon dashboard at https://console.neon.tech');
    process.exit(1);
  }

  console.log('Connecting to database...\n');
  const sql = neon(connectionString);

  try {
    console.log('→ Adding composite index on auth_sessions(token, expires_at)...');
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_expires_at 
      ON auth_sessions(token, expires_at) 
      WHERE expires_at > NOW()
    `;

    console.log('✓ Migration completed successfully!');
    console.log('\nThe composite index idx_auth_sessions_token_expires_at has been added.');
    console.log('This will optimize session lookup queries used in admin authentication.');
    
  } catch (err) {
    console.error('❌ Migration failed:');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

runMigration();
