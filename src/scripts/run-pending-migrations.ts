import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sqlUnsafe } from '../lib/db';

const migrationsToRun = [
  {
    name: '034-fix-data-bundle-columns',
    file: path.join(__dirname, '034-fix-data-bundle-columns.sql'),
  },
  {
    name: '018_datamart_orders',
    file: path.join(__dirname, '..', 'lib', 'db', 'migrations', '018_datamart_orders.sql'),
  },
  {
    name: '019_fix_data_bundles_network_nullable',
    file: path.join(__dirname, '..', 'lib', 'db', 'migrations', '019_fix_data_bundles_network_nullable.sql'),
  },
  {
    name: '036_datamart_orders_user_id',
    file: path.join(__dirname, '..', 'lib', 'db', 'migrations', '036_datamart_orders_user_id.sql'),
  },
];

async function runMigrations() {
  for (const migration of migrationsToRun) {
    if (!fs.existsSync(migration.file)) {
      console.log(`SKIP ${migration.name} — file not found at ${migration.file}`);
      continue;
    }

    const sqlContent = fs.readFileSync(migration.file, 'utf-8');
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`RUN  ${migration.name} (${statements.length} statements)...`);

    let ok = 0;
    let fail = 0;
    for (const statement of statements) {
      try {
        await sqlUnsafe(statement + ';');
        ok++;
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('violates')) {
          ok++;
        } else {
          console.log(`  ERR: ${msg.substring(0, 200)}`);
          fail++;
        }
      }
    }

    console.log(`  ${fail === 0 ? 'OK' : 'PARTIAL'} ${migration.name} — ${ok} ok, ${fail} failed`);
  }
}

runMigrations().then(() => {
  console.log('\nDone.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
