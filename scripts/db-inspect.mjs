import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

try {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("TABLES:", tables.map((t) => t.table_name).join(", "));

  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`;
  console.log("USERS COLUMNS:", cols.map((c) => `${c.column_name}(${c.data_type})`).join(", "));

  const admins = await sql`SELECT id, email, role FROM users WHERE UPPER(role) = 'ADMIN' LIMIT 5`;
  console.log("ADMINS:", JSON.stringify(admins));

  const count = await sql`SELECT COUNT(*)::int AS n FROM users`;
  console.log("USER COUNT:", count[0].n);
} catch (e) {
  console.error("ERR:", e.message);
}
