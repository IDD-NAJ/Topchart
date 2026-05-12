import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sqlUnsafe } from '../lib/db';

async function test() {
  const selectCols = `
    b.id,
    n.name as network_id,
    b.name,
    b."sizeMb",
    b."validityHours",
    b.price as "providerPrice",
    b."priceOverride",
    b."markupPercent",
    b."isPopular",
    b."isActive",
    b."isFeatured",
    b."datamartPlanId",
    b."datamartPlanType",
    b."updatedAt" as "syncedAt",
    b."updatedAt"`;

  const joinClause = `FROM data_bundles b LEFT JOIN networks n ON COALESCE(b."networkId", b.network_id::uuid) = n.id`;

  try {
    const result = await sqlUnsafe(
      `SELECT ${selectCols} ${joinClause} WHERE b."isActive" = true ORDER BY n.name, b.price ASC`
    );
    console.log(`SUCCESS: ${result.length} plans fetched`);
    console.log('First 3:', (result as any[]).slice(0, 3).map(r => ({ id: r.id, network: r.network_id, name: r.name, price: r.providerPrice })));
  } catch (err: any) {
    console.error('FAILED:', err?.message || err);
  }

  process.exit(0);
}

test();
