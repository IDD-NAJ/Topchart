import { sql } from "@/lib/db";

async function runMigration() {
  console.log("Creating missing admin tables...");
  
  try {
    // Networks table
    await sql`
      CREATE TABLE IF NOT EXISTS networks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        prefixes JSONB NOT NULL DEFAULT '[]'::jsonb,
        min_amount NUMERIC(12,4) DEFAULT 0,
        max_amount NUMERIC(12,4) DEFAULT 10000,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created networks table");

    await sql`CREATE INDEX IF NOT EXISTS idx_networks_code ON networks(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_networks_active ON networks(is_active)`;

    // Referrals table
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
        code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created referrals table");

    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`;

    // Data bundle purchases table
    await sql`
      CREATE TABLE IF NOT EXISTS data_bundle_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bundle_id TEXT NOT NULL,
        bundle_name TEXT,
        recipient_phone TEXT NOT NULL,
        network TEXT NOT NULL,
        amount NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created data_bundle_purchases table");

    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_user_id ON data_bundle_purchases(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_status ON data_bundle_purchases(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_created_at ON data_bundle_purchases(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_recipient_phone ON data_bundle_purchases(recipient_phone)`;

    // Insert default networks
    const networksExist = await sql`SELECT COUNT(*) FROM networks`;
    if (networksExist[0].count === 0) {
      await sql`
        INSERT INTO networks (name, code, prefixes, min_amount, max_amount) VALUES
        ('MTN Ghana', 'mtn', '["024", "054", "055", "059", "020"]'::jsonb, 0.50, 1000),
        ('Vodafone/Telecel', 'vodafone', '["020", "050", "026"]'::jsonb, 0.50, 1000),
        ('AirtelTigo', 'airteltigo', '["026", "027", "028", "056", "057"]'::jsonb, 0.50, 1000),
        ('Glo Ghana', 'glo', '["023", "024", "025", "055", "056"]'::jsonb, 0.50, 1000)
        ON CONFLICT (code) DO NOTHING
      `;
      console.log("✓ Inserted default networks");
    }

    console.log("\n✅ All tables created successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration error:", error);
    process.exit(1);
  });
