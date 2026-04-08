#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * Runs all SQL migration files in order against the configured database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration files in order
const migrations = [
  '001-create-tables.sql',
  '002-add-paystack-columns.sql',
  '003-create-auth-sessions.sql',
  '004-fix-transactions-user-id.sql',
  '005-reset-transactions-table.sql',
  '006-fix-transactions-updatedAt.sql',
  '007-fix-wallets-updatedAt.sql',
  '008-add-user-role.sql',
  '009-add-role-constraint.sql',
  '010-create-content-tables.sql',
  '011-create-blog-tables.sql',
  '012-create-faqs-table.sql',
  '013-create-press-tables.sql',
];

function getCleanConnectionString(): string {
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

  // Remove problematic parameters that cause connection issues
  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, '');
  connectionString = connectionString.replace(/[&?]pooler_timeout=[^&]*/g, '');
  connectionString = connectionString.replace(/&&/g, '&').replace(/\?&/g, '?').replace(/[?&]$/, '');

  return connectionString.trim();
}

function getSql(): NeonQueryFunction<false, false> {
  const connectionString = getCleanConnectionString();
  if (connectionString && (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://'))) {
    return neon(connectionString);
  }

  throw new Error(
    'Database not configured. Please set DATABASE_URL environment variable in .env.local file.\n' +
    'Example: DATABASE_URL=postgresql://username:password@hostname/database\n' +
    'Get your connection string from your Neon dashboard at https://console.neon.tech'
  );
}

async function runMigrations() {
  const sql = getSql();

  console.log('Connecting to database...\n');

  try {
    // Create migrations tracking table if it doesn't exist
    await sql`CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;

    // Get already executed migrations
    const executed = await sql`SELECT filename FROM _migrations`;
    const executedSet = new Set((executed as Record<string, string>[]).map(r => r.filename));

    console.log(`Found ${executedSet.size} previously executed migrations`);
    console.log(`Running ${migrations.length - executedSet.size} pending migrations...\n`);

    for (const migration of migrations) {
      if (executedSet.has(migration)) {
        console.log(`✓ ${migration} (already executed)`);
        continue;
      }

      const filePath = path.join(__dirname, migration);

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠ ${migration} - file not found, skipping`);
        continue;
      }

      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      console.log(`→ Running ${migration}...`);

      try {
        // Split SQL into individual statements and execute
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
          if (statement) {
            await sql.unsafe(statement + ';');
          }
        }

        // Record migration
        await sql`INSERT INTO _migrations (filename) VALUES (${migration})`;

        console.log(`✓ ${migration} - success\n`);
      } catch (err) {
        console.error(`✗ ${migration} - FAILED`);
        console.error(`  Error: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\nYour content tables are now ready:');
    console.log('  - jobs, perks (careers page)');
    console.log('  - posts, blog_categories (blog page)');
    console.log('  - faqs (faq page)');
    console.log('  - press_stats, press_assets (press page)');

  } catch (err) {
    console.error('\n❌ Migration failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

runMigrations();
