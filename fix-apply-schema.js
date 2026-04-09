const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function fixSchema() {
  console.log("Adding missing columns to reseller_applications...");

  const fixes = [
    {
      desc: "custom_fields JSONB",
      sql: `ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb`,
    },
    {
      desc: "transaction_id UUID",
      sql: `ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS transaction_id UUID`,
    },
    {
      desc: "notes TEXT",
      sql: `ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS notes TEXT`,
    },
    {
      desc: "referred_by on users",
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50)`,
    },
    {
      desc: "reseller_profiles.referred_count",
      sql: `ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS referred_count INTEGER DEFAULT 0`,
    },
    {
      desc: "reseller_referral_links table",
      sql: `CREATE TABLE IF NOT EXISTS reseller_referral_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        referral_code VARCHAR(100) UNIQUE NOT NULL,
        landing_page VARCHAR(255) DEFAULT '/register',
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "fraud_alerts table",
      sql: `CREATE TABLE IF NOT EXISTS fraud_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        alert_type VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        status VARCHAR(20) DEFAULT 'open',
        resolved_at TIMESTAMP,
        resolved_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "reseller_audit_logs table",
      sql: `CREATE TABLE IF NOT EXISTS reseller_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        user_id UUID,
        action VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "rate_limit_violations table",
      sql: `CREATE TABLE IF NOT EXISTS rate_limit_violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        endpoint VARCHAR(255),
        violation_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "suspicious_transactions table",
      sql: `CREATE TABLE IF NOT EXISTS suspicious_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        transaction_id VARCHAR(255),
        reason TEXT,
        risk_score INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'flagged',
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "marketing_assets table",
      sql: `CREATE TABLE IF NOT EXISTS marketing_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        category VARCHAR(100),
        file_url TEXT,
        thumbnail_url TEXT,
        download_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
    {
      desc: "reseller_daily_stats table",
      sql: `CREATE TABLE IF NOT EXISTS reseller_daily_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        sales_count INTEGER DEFAULT 0,
        sales_amount DECIMAL(12,2) DEFAULT 0,
        commission_earned DECIMAL(12,2) DEFAULT 0,
        new_referrals INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(reseller_id, date)
      )`,
    },
    {
      desc: "reseller_geographic_stats table",
      sql: `CREATE TABLE IF NOT EXISTS reseller_geographic_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        region VARCHAR(100),
        city VARCHAR(100),
        sales_count INTEGER DEFAULT 0,
        sales_amount DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
    },
  ];

  for (const fix of fixes) {
    try {
      await sql.query(fix.sql);
      console.log(`  ✓ ${fix.desc}`);
    } catch (err) {
      console.error(`  ✗ ${fix.desc}: ${err.message}`);
    }
  }

  console.log("\nDone! All schema fixes applied.");
  process.exit(0);
}

fixSchema().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
