#!/usr/bin/env tsx
/**
 * Reseller Database Migration Runner
 * Runs all reseller-related SQL migration files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reseller migration files in order
const resellerMigrations = [
  '002-add-reseller-tables.sql',
  '003-add-fraud-tables.sql',
  '004-add-tier-tables.sql',
  '005-add-analytics-tables.sql',
  '006-reseller-form-customization.sql',
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

  connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/g, '');
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

async function runResellerMigrations() {
  const sql = getSql();

  console.log('Connecting to database...\n');

  try {
    // Create migrations tracking table if it doesn't exist
    await sql`CREATE TABLE IF NOT EXISTS _reseller_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;

    // Get already executed migrations
    const executed = await sql`SELECT filename FROM _reseller_migrations`;
    const executedSet = new Set((executed as Record<string, string>[]).map(r => r.filename));

    console.log(`Found ${executedSet.size} previously executed reseller migrations`);
    console.log(`Running ${resellerMigrations.length - executedSet.size} pending reseller migrations...\n`);

    for (const migration of resellerMigrations) {
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
        // Execute the entire SQL file at once
        await sql.unsafe(sqlContent);

        // Record migration
        await sql`INSERT INTO _reseller_migrations (filename) VALUES (${migration})`;

        console.log(`✓ ${migration} - success\n`);
      } catch (err) {
        console.error(`✗ ${migration} - FAILED`);
        console.error(`  Error: ${err instanceof Error ? err.message : err}`);
        throw err;
      }
    }

    console.log('\n✅ All reseller migrations completed successfully!');
    console.log('\nReseller tables now ready:');
    console.log('  - reseller_applications, reseller_profiles, reseller_sales');
    console.log('  - reseller_commissions, result_checker_cards, reseller_inventory');
    console.log('  - fraud_alerts, reseller_audit_logs, rate_limit_violations');
    console.log('  - reseller_tiers, marketing_assets, reseller_referral_links');
    console.log('  - reseller_daily_stats, reseller_geographic_stats');
    console.log('  - admin_audit_logs, error_logs, slow_query_logs');

  } catch (err) {
    console.error('\n❌ Reseller migration failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

runResellerMigrations();
