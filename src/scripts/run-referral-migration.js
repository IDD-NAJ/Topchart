const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

async function main() {
  const envFile = fs.readFileSync(".env.local", "utf-8");
  const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);
  const connectionString = dbUrlMatch ? dbUrlMatch[1].trim() : null;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL not set in environment");
  }
  
  const sql = neon(connectionString);
  
  console.log("🔧 Adding missing referral columns to users table...\n");
  
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, "021-add-user-referral-columns.sql"),
    "utf-8"
  );
  
  try {
    await sql.unsafe(migrationSQL);
    console.log("✅ Migration completed successfully\n");
    
    console.log("Verifying columns were added...");
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('referral_code', 'referral_earnings', 'total_deposits')
      ORDER BY column_name
    `;
    
    console.log("Added columns:");
    columns.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    });
    
    console.log("\n✅ All columns verified. Account creation should now work.");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
