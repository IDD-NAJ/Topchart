require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function setupTravelEsim() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ No DATABASE_URL found in .env.local');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('📦 Creating Travel Data eSIM tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS esim_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        region TEXT,
        data_volume TEXT NOT NULL,
        validity_days INTEGER NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS esim_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES esim_products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
        activation_code TEXT,
        qr_code_url TEXT,
        provider_response JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_esim_orders_status ON esim_orders(status);
      CREATE INDEX IF NOT EXISTS idx_esim_orders_user_id ON esim_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_esim_orders_product_id ON esim_orders(product_id);

      CREATE TABLE IF NOT EXISTS esim_settings (
        id SERIAL PRIMARY KEY,
        provider_name TEXT,
        api_key TEXT,
        base_url TEXT,
        is_active BOOLEAN DEFAULT false,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Tables created successfully.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

setupTravelEsim();
