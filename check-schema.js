import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const client = new Client({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'homepage_media' ORDER BY ordinal_position");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);
