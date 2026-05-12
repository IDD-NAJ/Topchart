import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sql } from '../lib/db';

async function main() {
  const cols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'data_bundles' ORDER BY ordinal_position`;
  console.log('data_bundles columns:');
  for (const c of cols as any[]) {
    console.log(`  ${c.column_name} (${c.data_type}, nullable=${c.is_nullable})`);
  }
  process.exit(0);
}
main();
