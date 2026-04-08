const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

async function main() {
  loadEnv();
  const sql = neon(process.env.DATABASE_URL);

  // Get all tables and their columns
  const cols = await sql`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;

  const tables = {};
  for (const row of cols) {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row.column_name);
  }

  console.log('=== ACTUAL DATABASE SCHEMA ===\n');
  for (const [table, columns] of Object.entries(tables).sort()) {
    console.log(`${table}: ${columns.join(', ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
