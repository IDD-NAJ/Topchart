import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_CdErv90DWHzP@ep-divine-frog-ahe05se1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function checkTables() {
  const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log(result.map(r => r.table_name));
}

checkTables().catch(console.error);
