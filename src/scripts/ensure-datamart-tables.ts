import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sql, sqlUnsafe } from '../lib/db';
import { syncDatamartPlans } from '../lib/datamart-sync';

const REQUIRED_MIGRATIONS = [
  {
    name: '022-create-data-bundles-tables',
    check: () => sql`SELECT to_regclass('public.data_bundles') as exists`,
  },
  {
    name: '026-add-pricing-fields-to-data-bundles',
    check: () => sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'data_bundles' AND column_name = 'price_override'`,
  },
  {
    name: '034-fix-data-bundle-columns',
    check: () => sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'data_bundles' AND column_name = 'category_id'`,
  },
  {
    name: '018_datamart_orders',
    check: () => sql`SELECT to_regclass('public.datamart_orders') as exists`,
  },
  {
    name: '019_fix_data_bundles_network_nullable',
    check: () => sql`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'data_bundles' AND column_name = 'networkId'`,
  },
];

async function ensureMigrations() {
  console.log('Checking required tables/columns...\n');

  for (const migration of REQUIRED_MIGRATIONS) {
    try {
      const result = await migration.check() as any[];
      const row = result[0];

      if (migration.name === '022-create-data-bundles-tables') {
        if (row?.exists) {
          console.log(`  OK   ${migration.name} (data_bundles exists)`);
          continue;
        }
      } else if (migration.name === '026-add-pricing-fields-to-data-bundles') {
        if (result.length > 0) {
          console.log(`  OK   ${migration.name} (price_override column exists)`);
          continue;
        }
      } else if (migration.name === '034-fix-data-bundle-columns') {
        if (result.length > 0) {
          console.log(`  OK   ${migration.name} (category_id column exists)`);
          continue;
        }
      } else if (migration.name === '018_datamart_orders') {
        if (row?.exists) {
          console.log(`  OK   ${migration.name} (datamart_orders exists)`);
          continue;
        }
      } else if (migration.name === '019_fix_data_bundles_network_nullable') {
        if (result.length > 0 && row?.is_nullable === 'YES') {
          console.log(`  OK   ${migration.name} (networkId is nullable)`);
          continue;
        }
      }

      console.log(`  MISS ${migration.name} — needs to be applied manually in Neon SQL Editor`);
    } catch (err: any) {
      console.log(`  ERR  ${migration.name}: ${err?.message || err}`);
    }
  }
}

async function syncPlans() {
  console.log('\nSyncing DataMart plans into data_bundles...');
  try {
    const result = await syncDatamartPlans({ force: true });
    console.log(`\nSync result:`);
    console.log(`  Synced:   ${result.syncedCount}`);
    console.log(`  Errors:   ${result.errorCount}`);
    console.log(`  Deactivated: ${result.deactivatedCount}`);
    console.log(`  Source:   ${result.source}`);
    if (result.errors.length > 0) {
      console.log(`  Error details:`);
      result.errors.forEach(e => console.log(`    - ${e}`));
    }
  } catch (err: any) {
    console.error('Sync failed:', err?.message || err);
  }
}

async function main() {
  await ensureMigrations();
  await syncPlans();
  console.log('\nDone.');
  process.exit(0);
}

main();
