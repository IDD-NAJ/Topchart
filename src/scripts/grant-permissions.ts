import { loadEnvConfig } from '@next/env';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(path.join(__dirname, '..', '..'));

import { sql, sqlUnsafe } from '../lib/db';

async function main() {
  const currentRole = await sql`SELECT current_user, session_user`;
  const role = (currentRole as any[])[0]?.current_user;
  console.log('Current DB role:', role);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  
  const allTableNames = (tables as any[]).map(t => t.table_name);
  console.log(`Found ${allTableNames.length} tables`);

  let ok = 0;
  let fail = 0;
  for (const table of allTableNames) {
    try {
      await sqlUnsafe(`GRANT ALL PRIVILEGES ON TABLE ${table} TO ${role}`);
      ok++;
    } catch (err: any) {
      fail++;
    }
  }
  
  console.log(`GRANT results: ${ok} ok, ${fail} failed`);

  if (fail > 0) {
    console.log('\n=== PASTE THIS INTO NEON SQL EDITOR ===');
    for (const table of allTableNames) {
      console.log(`GRANT ALL PRIVILEGES ON TABLE public.${table} TO ${role};`);
    }
  }

  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
