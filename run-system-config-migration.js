const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
    
    console.log('✅ Environment variables loaded');
  } catch (error) {
    console.log('⚠️  Could not load .env.local file:', error.message);
  }
}

async function runSystemConfigMigration() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🗄️  Running system_config migration...');
    
    // Check if table exists first
    const checkResult = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'system_config'
    `;
    
    console.log('📋 Table check result:', checkResult);
    
    if (checkResult.length === 0) {
      console.log('🔧 Creating system_config table manually...');
      
      // Create the table
      await sql`
        CREATE TABLE IF NOT EXISTS system_config (
          id SERIAL PRIMARY KEY,
          config_key VARCHAR(100) UNIQUE NOT NULL,
          config_value JSONB NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_by UUID REFERENCES users(id)
        )
      `;
      
      console.log('✅ system_config table created');
      
      // Create the custom_form_fields table
      await sql`
        CREATE TABLE IF NOT EXISTS custom_form_fields (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          field_name VARCHAR(100) NOT NULL,
          field_label VARCHAR(200) NOT NULL,
          field_type VARCHAR(50) NOT NULL,
          field_options JSONB,
          is_required BOOLEAN DEFAULT false,
          is_enabled BOOLEAN DEFAULT true,
          placeholder TEXT,
          help_text TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      
      console.log('✅ custom_form_fields table created');
      
      // Insert default config
      await sql`
        INSERT INTO system_config (config_key, config_value, description) VALUES
        ('reseller_form_config', '{
          "business_name": {"enabled": true, "required": true},
          "business_address": {"enabled": true, "required": false},
          "business_phone": {"enabled": true, "required": false},
          "business_email": {"enabled": true, "required": false},
          "business_type": {"enabled": true, "required": false},
          "application_fee": 100.00,
          "currency": "GHS",
          "require_payment_before_approval": true
        }'::jsonb, 'Reseller application form configuration'),
        ('reseller_form_custom_fields', '[]'::jsonb, 'Custom fields for reseller application form')
        ON CONFLICT (config_key) DO NOTHING
      `;
      
      console.log('✅ Default config inserted');
      
      // Create index
      await sql`
        CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key)
      `;
      
      console.log('✅ Index created');
    } else {
      console.log('✅ system_config table already exists');
    }
    
    // Verify the tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('system_config', 'custom_form_fields')
      ORDER BY table_name
    `;
    
    console.log('📋 Tables after migration:', tables);
    
    // Check the data
    const configData = await sql`
      SELECT * FROM system_config WHERE config_key = 'reseller_form_config'
    `;
    
    console.log('📋 Config data:', configData);
    
  } catch (error) {
    console.error('❌ Error running system_config migration:', error);
    process.exit(1);
  }
}

runSystemConfigMigration().then(() => {
  console.log('\n🏁 System config migration completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 System config migration failed:', error);
  process.exit(1);
});
