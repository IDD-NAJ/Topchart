const { neon } = require("@neondatabase/serverless");
const fs = require("fs");

async function main() {
  const envFile = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);
  const connectionString = dbUrlMatch ? dbUrlMatch[1].trim() : null;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL not set");
  }
  
  const sql = neon(connectionString);
  
  console.log("Checking users table schema...\n");
  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `;
  
  console.log("Users table columns:");
  columns.forEach(col => {
    console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
  });
  
  console.log("\nChecking auth_sessions table...");
  const sessionTableCheck = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_name = 'auth_sessions'
  `;
  
  if (sessionTableCheck.length > 0) {
    console.log("  ✓ auth_sessions table exists");
    const sessionColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'auth_sessions' 
      ORDER BY ordinal_position
    `;
    console.log("  Columns:");
    sessionColumns.forEach(col => {
      console.log(`    - ${col.column_name} (${col.data_type})`);
    });
  } else {
    console.log("  ✗ auth_sessions table Last NameS NOT EXIST");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
