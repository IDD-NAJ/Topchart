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
  
  console.log("Adding updated_at column to users table...\n");
  
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    console.log("✅ updated_at column added");
    
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'updated_at'
    `;
    
    if (columns.length > 0) {
      console.log("✅ verified: updated_at column exists");
    } else {
      console.log("⚠️ warning: updated_at column not found after add");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
