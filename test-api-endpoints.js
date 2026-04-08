// This script will test the API endpoints directly to see the debug logs
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

async function testAPIEndpoints() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🧪 Testing API endpoints simulation...');
    
    // Step 1: Simulate GET request (what the frontend does on load)
    console.log('\n📡 Step 1: Simulating GET /api/admin/reseller-form-config');
    
    const configResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    
    console.log('🔍 API DEBUG: Raw config from database:', configResult);
    
    const config = configResult[0]?.config_value || {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 100.00,
      currency: "GHS",
      require_payment_before_approval: true
    };
    
    console.log('🔍 API DEBUG: Final config being returned:', config);
    console.log('💰 Current application_fee:', config.application_fee);
    
    // Step 2: Simulate PUT request (what the frontend does on save)
    console.log('\n💾 Step 2: Simulating PUT /api/admin/reseller-form-config');
    
    const newConfig = {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 199.99,  // Changed value
      currency: "GHS",
      require_payment_before_approval: true
    };
    
    console.log('🔍 API DEBUG: Received config to save:', newConfig);
    
    // Check current config before update
    const currentConfigResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    console.log('🔍 API DEBUG: Current config in database:', currentConfigResult[0]?.config_value);
    
    // Update config
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_by, updated_at)
      VALUES ('reseller_form_config', ${JSON.stringify(newConfig)}::jsonb, 
              (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1), NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET 
        config_value = ${JSON.stringify(newConfig)}::jsonb,
        updated_by = (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1),
        updated_at = NOW()
    `;
    
    // Verify the update
    const verifyResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    console.log('🔍 API DEBUG: Config after save:', verifyResult[0]?.config_value);
    
    // Step 3: Simulate another GET to verify the frontend would get the updated value
    console.log('\n🔍 Step 3: Simulating another GET to verify persistence');
    
    const finalConfigResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    
    const finalConfig = finalConfigResult[0]?.config_value;
    console.log('🔍 API DEBUG: Final config after reload:', finalConfig);
    console.log('💰 Final application_fee:', finalConfig.application_fee);
    
    if (finalConfig.application_fee === newConfig.application_fee) {
      console.log('✅ SUCCESS: Configuration is persisting correctly!');
      console.log('🎯 The issue is likely in the frontend not properly updating after save');
    } else {
      console.log('❌ ERROR: Configuration is not persisting!');
      console.log('🔍 Expected:', newConfig.application_fee);
      console.log('🔍 Actual:', finalConfig.application_fee);
    }
    
    // Step 4: Check what the frontend default fallback would be
    console.log('\n📋 Step 4: Checking frontend default fallback');
    const frontendDefault = {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 100.00,
      currency: "GHS",
      require_payment_before_approval: true
    };
    
    console.log('📱 Frontend default application_fee:', frontendDefault.application_fee);
    console.log('💾 Database application_fee:', finalConfig.application_fee);
    
    if (finalConfig.application_fee === frontendDefault.application_fee) {
      console.log('⚠️  WARNING: Database value matches frontend default!');
      console.log('🔍 This suggests the frontend might be overwriting the database value');
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
    process.exit(1);
  }
}

testAPIEndpoints().then(() => {
  console.log('\n🏁 API endpoint testing completed');
  console.log('\n🎯 Next steps:');
  console.log('1. Open browser to http://localhost:3000/admin/login');
  console.log('2. Login with najeebiddrisu79@gmail.com / Gold4me.471@1761');
  console.log('3. Navigate to http://localhost:3000/admin/reseller-form-config');
  console.log('4. Open browser developer tools (F12) and check Console tab');
  console.log('5. Change the application fee value and click Save');
  console.log('6. Look for the 🔍 DEBUG messages in the console');
  process.exit(0);
}).catch((error) => {
  console.error('💥 API endpoint testing failed:', error);
  process.exit(1);
});
