require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Use direct connection for schema changes (pooler has limited permissions)
let connectionString = (process.env.DATABASE_URL || '');

// Convert pooler URL to direct URL for schema changes
connectionString = connectionString.replace(/-pooler/g, '');

// Remove pooler-specific parameters
connectionString = connectionString
  .replace(/[&?]channel_binding=[^&]*/g, '')
  .replace(/[&?]pooler_timeout=[^&]*/g, '')
  .replace(/&&/g, '&')
  .replace(/\?&/g, '?')
  .replace(/[?&]$/, '')
  .trim();

if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
  console.error('DATABASE_URL not set or invalid');
  process.exit(1);
}

const sql = neon(connectionString);

const migrationsDir = path.join(__dirname, 'src', 'scripts');

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
  '036-esim-admin-tables.sql',
  '018_homepage_content_tables.sql',
];

async function runMigrations() {
  console.log('Connecting to Neon database...\n');

  try {
    await sql`CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;

    const executed = await sql`SELECT filename FROM _migrations`;
    const executedSet = new Set(executed.map(r => r.filename));

    console.log(`Found ${executedSet.size} previously executed migrations`);
    console.log(`Running ${migrations.length - executedSet.size} pending migrations...\n`);

    for (const migration of migrations) {
      if (executedSet.has(migration)) {
        console.log(`  SKIP ${migration}`);
        continue;
      }

      const filePath = path.join(migrationsDir, migration);
      if (!fs.existsSync(filePath)) {
        console.warn(`  WARN ${migration} - file not found, skipping`);
        continue;
      }

      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      console.log(`  RUN  ${migration}...`);

      try {
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        for (const statement of statements) {
          if (statement) {
            await sql.unsafe(statement + ';');
          }
        }

        await sql`INSERT INTO _migrations (filename) VALUES (${migration})`;
        console.log(`  OK   ${migration}`);
      } catch (err) {
        console.error(`  FAIL ${migration}: ${err.message}`);
      }
    }

    console.log('\nAll migrations completed!');
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();
