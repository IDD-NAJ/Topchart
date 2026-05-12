import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sql, sqlUnsafe } from '../lib/db';

async function diagnose() {
  console.log('=== Diagnosing plans fetch ===\n');

  const bundles = await sqlUnsafe(`SELECT id, network_id, "networkId", name, price, "isActive" FROM data_bundles LIMIT 5`);
  console.log('Sample data_bundles rows:');
  for (const b of bundles as any[]) {
    console.log(`  id=${b.id} | network_id=${b.network_id} | networkId=${b.networkId} | name=${b.name} | price=${b.price} | isActive=${b.isActive}`);
  }

  const networks = await sql`SELECT id, name FROM networks`;
  console.log('\nNetworks table:');
  for (const n of networks as any[]) {
    console.log(`  id=${n.id} | name=${n.name}`);
  }

  const joinTest = await sqlUnsafe(`
    SELECT b.id, b.name, n.name as network_name
    FROM data_bundles b
    LEFT JOIN networks n ON COALESCE(b."networkId", b.network_id::uuid) = n.id
    LIMIT 5
  `);
  console.log('\nJOIN test (data_bundles + networks):');
  for (const r of joinTest as any[]) {
    console.log(`  bundle=${r.name} | network=${r.network_name || 'NULL JOIN!'}`);
  }

  const activeCount = await sqlUnsafe(`SELECT COUNT(*) as cnt FROM data_bundles WHERE "isActive" = true`);
  console.log(`\nActive bundles count: ${(activeCount as any[])[0].cnt}`);

  const nullNetworkId = await sqlUnsafe(`SELECT COUNT(*) as cnt FROM data_bundles WHERE "networkId" IS NULL AND network_id IS NULL`);
  console.log(`Bundles with BOTH network IDs null: ${(nullNetworkId as any[])[0].cnt}`);

  process.exit(0);
}

diagnose().catch(err => { console.error(err); process.exit(1); });
