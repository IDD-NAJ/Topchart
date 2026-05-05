#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * Runs all SQL migration files in order against the configured database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnvConfig } from '@next/env';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvConfig(path.join(__dirname, '..', '..'));

const migrationDirs = [
  path.join(__dirname, '..', 'lib', 'db', 'migrations'),
  __dirname,
];

function findMigrationFile(filename: string): string | null {
  for (const dir of migrationDirs) {
    const fullPath = path.join(dir, filename);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

// Migration files in order
const migrations = [
  '001-create-tables.sql',
  '002-add-paystack-columns.sql',
  '002-add-reseller-tables.sql',
  '003-create-auth-sessions.sql',
  '003-add-fraud-tables.sql',
  '003-normalize-emails.sql',
  '004-fix-transactions-user-id.sql',
  '004-add-tier-tables.sql',
  '005-reset-transactions-table.sql',
  '005-add-analytics-tables.sql',
  '006-fix-transactions-updatedAt.sql',
  '006-reseller-form-customization.sql',
  '007-fix-wallets-updatedAt.sql',
  '008-add-user-role.sql',
  '009-add-role-constraint.sql',
  '010-create-content-tables.sql',
  '011-create-blog-tables.sql',
  '012-create-faqs-table.sql',
  '013-create-press-tables.sql',
  '015-add-verification-tables.sql',
  '016-fix-reseller-tables.sql',
  '016-pvadeals-migration.sql',
  '017a-create-core-tables.sql',
  '017b-create-indexes.sql',
  '017c-seed-services.sql',
  '018-complete-reseller-migration.sql',
  '019-transaction-refund-support.sql',
  '020-referral-links.sql',
  '021-add-user-referral-columns.sql',
  '022-create-data-bundles-tables.sql',
  '023-create-favorites-table.sql',
  '024-create-homepage-images-table.sql',
  '025-create-homepage-media-table.sql',
  '026-add-auth-sessions-composite-index.sql',
  '026-add-pricing-fields-to-data-bundles.sql',
  '027-add-reloadly-fields.sql',
  '029-add-performance-indexes.sql',
  '030-optimize-homepage-media.sql',
  '031-create-service-status-table.sql',
  '032-add-maintenance-columns.sql',
  '033-create-transactions-table.sql',
  '034-fix-data-bundle-columns.sql',
  '008_add_pricing_tables.sql',
  '009_add_bill_providers.sql',
  '010_sync_wallets.sql',
  '010_unified_bill_payments.sql',
  '011_homepage_media.sql',
  '012_esim_order_processing.sql',
  '013_add_esim_phone_plans_description.sql',
  '014_create_referrals_table.sql',
  '015_enhance_homepage_media.sql',
  '016_normalize_homepage_media_model.sql',
  '017_add_status_version.sql',
  '018_datamart_orders.sql',
  '019_fix_data_bundles_network_nullable.sql',
  '020-create-missing-admin-tables.sql',
  '036-esim-admin-tables.sql',
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

      const filePath = findMigrationFile(migration);

      if (!filePath) {
        console.warn(`⚠ ${migration} - file not found in any migration directory, skipping`);
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
