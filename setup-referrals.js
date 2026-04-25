require('dotenv').config({ path: '.env.local' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function setupReferrals() {
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
    console.log('📦 Creating referrals and referral_settings tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_settings (
        id SERIAL PRIMARY KEY,
        referral_reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
        min_referrals_required INTEGER NOT NULL DEFAULT 10,
        min_deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO referral_settings (id, referral_reward_amount, min_referrals_required, min_deposit_amount)
      VALUES (1, 5.00, 10, 20.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    await pool.query(`
      DROP TABLE IF EXISTS referrals CASCADE;
      CREATE TABLE referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'qualified', 'rewarded')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        qualified_at TIMESTAMPTZ,
        UNIQUE (referred_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);
    `);

    console.log('✅ Tables created successfully.');
    
    console.log('📦 Backfilling existing users into referrals table...');
    const result = await pool.query(`
      INSERT INTO referrals (referrer_id, referred_user_id, status, created_at)
      SELECT 
        (SELECT id FROM users WHERE referral_code = u.referred_by LIMIT 1) as referrer_id,
        u.id as referred_user_id,
        'pending' as status,
        u.created_at
      FROM users u
      WHERE u.referred_by IS NOT NULL
        AND EXISTS (SELECT 1 FROM users r WHERE r.referral_code = u.referred_by)
        AND NOT EXISTS (SELECT 1 FROM referrals ref WHERE ref.referred_user_id = u.id)
      RETURNING id;
    `);
    
    console.log(`✅ Backfilled ${result.rowCount} existing referrals as 'pending'.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

setupReferrals();
