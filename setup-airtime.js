import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_CdErv90DWHzP@ep-divine-frog-ahe05se1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function setupAirtimePricing() {
  await sql`
    CREATE TABLE IF NOT EXISTS airtime_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      network VARCHAR(50) NOT NULL UNIQUE,
      discount_percent NUMERIC(5,2) DEFAULT 0,
      markup_percent NUMERIC(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      min_amount NUMERIC(10,2) DEFAULT 1.00,
      max_amount NUMERIC(10,2) DEFAULT 1000.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log("airtime_pricing table created or already exists");

  // Insert default values for main networks
  const networks = ['MTN', 'Vodafone', 'AirtelTigo'];
  for (const net of networks) {
    await sql`
      INSERT INTO airtime_pricing (network, is_active)
      VALUES (${net}, true)
      ON CONFLICT (network) DO NOTHING;
    `;
  }
  console.log("Default network rows inserted");
}

setupAirtimePricing().catch(console.error);
