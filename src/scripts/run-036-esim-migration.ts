import { sql } from "@/lib/db";

async function runMigration() {
  console.log("Running migration 036: Create eSIM admin tables...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS esim_phone_plans (
        id TEXT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(200),
        price DECIMAL(10, 2) NOT NULL,
        minutes INTEGER NOT NULL DEFAULT 0,
        sms INTEGER NOT NULL DEFAULT 0,
        validity_days INTEGER NOT NULL DEFAULT 30,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        popular BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created esim_phone_plans table");

    await sql`CREATE INDEX IF NOT EXISTS idx_esim_phone_plans_active ON esim_phone_plans(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_phone_plans_sort ON esim_phone_plans(sort_order, price)`;

    await sql`
      CREATE TABLE IF NOT EXISTS esim_data_packages (
        id TEXT PRIMARY KEY,
        country VARCHAR(100) NOT NULL,
        country_code VARCHAR(5) NOT NULL,
        flag VARCHAR(10) DEFAULT '',
        data_allowance VARCHAR(50) NOT NULL,
        validity VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        network VARCHAR(100) NOT NULL,
        speed VARCHAR(50) NOT NULL DEFAULT '4G',
        region VARCHAR(50) NOT NULL DEFAULT 'africa',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created esim_data_packages table");

    await sql`CREATE INDEX IF NOT EXISTS idx_esim_data_packages_region ON esim_data_packages(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_data_packages_active ON esim_data_packages(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_data_packages_sort ON esim_data_packages(sort_order, price)`;

    await sql`
      CREATE TABLE IF NOT EXISTS esim_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        country VARCHAR(100) NOT NULL,
        region VARCHAR(100),
        data_volume VARCHAR(50) NOT NULL,
        validity_days INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Created esim_products table");

    await sql`CREATE INDEX IF NOT EXISTS idx_esim_products_active ON esim_products(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_products_country ON esim_products(country)`;

    await sql`
      ALTER TABLE esim_orders
      ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id)
    `;
    console.log("✓ Added processing columns to esim_orders");

    await sql`
      ALTER TABLE esim_orders DROP CONSTRAINT IF EXISTS esim_orders_processing_status_check
    `;
    await sql`
      ALTER TABLE esim_orders ADD CONSTRAINT esim_orders_processing_status_check
      CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_esim_orders_processing_status ON esim_orders(processing_status)`;

    await sql`
      ALTER TABLE proxy_orders
      ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id)
    `;
    console.log("✓ Added processing columns to proxy_orders");

    await sql`
      ALTER TABLE proxy_orders DROP CONSTRAINT IF EXISTS proxy_orders_processing_status_check
    `;
    await sql`
      ALTER TABLE proxy_orders ADD CONSTRAINT proxy_orders_processing_status_check
      CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_proxy_orders_processing_status ON proxy_orders(processing_status)`;

    await sql`
      ALTER TABLE giftcard_orders
      ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS admin_notes TEXT,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id)
    `;
    console.log("✓ Added processing columns to giftcard_orders");

    await sql`
      ALTER TABLE giftcard_orders DROP CONSTRAINT IF EXISTS giftcard_orders_processing_status_check
    `;
    await sql`
      ALTER TABLE giftcard_orders ADD CONSTRAINT giftcard_orders_processing_status_check
      CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_giftcard_orders_processing_status ON giftcard_orders(processing_status)`;

    await sql`GRANT ALL ON TABLE esim_phone_plans TO authenticator`;
    await sql`GRANT ALL ON TABLE esim_data_packages TO authenticator`;
    await sql`GRANT ALL ON TABLE esim_products TO authenticator`;
    console.log("✓ Granted permissions");

    console.log("\n✅ Migration 036 completed successfully!");
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
