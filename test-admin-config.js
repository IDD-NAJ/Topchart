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

async function testAdminConfigFlow() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🧪 Testing admin config flow...');
    
    // Step 1: Check current config in database
    console.log('\n📋 Step 1: Checking current config...');
    const currentConfig = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    
    if (currentConfig.length > 0) {
      console.log('✅ Current config found:', currentConfig[0].config_value);
    } else {
      console.log('❌ No config found in database');
    }
    
    // Step 2: Simulate saving a new config
    console.log('\n💾 Step 2: Simulating config save...');
    const testConfig = {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 250.75,  // Changed from default 100.00
      currency: "GHS",
      require_payment_before_approval: true
    };
    
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_by, updated_at)
      VALUES ('reseller_form_config', ${JSON.stringify(testConfig)}::jsonb, 
              (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1), NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET 
        config_value = ${JSON.stringify(testConfig)}::jsonb,
        updated_by = (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1),
        updated_at = NOW()
    `;
    
    console.log('✅ Test config saved with application_fee:', testConfig.application_fee);
    
    // Step 3: Verify the save
    console.log('\n🔍 Step 3: Verifying the save...');
    const verifyConfig = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    
    if (verifyConfig.length > 0) {
      console.log('✅ Config after save:', verifyConfig[0].config_value);
      const savedFee = verifyConfig[0].config_value.application_fee;
      console.log('💰 Application fee in database:', savedFee);
      
      if (savedFee === testConfig.application_fee) {
        console.log('✅ SUCCESS: Application fee saved correctly!');
      } else {
        console.log('❌ ERROR: Application fee mismatch!');
        console.log('   Expected:', testConfig.application_fee);
        console.log('   Actual:', savedFee);
      }
    } else {
      console.log('❌ No config found after save');
    }
    
    // Step 4: Test API simulation
    console.log('\n🌐 Step 4: Testing API simulation...');
    
    // Simulate what the API GET would return
    const apiResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    
    const config = apiResult[0]?.config_value || {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 100.00,
      currency: "GHS",
      require_payment_before_approval: true
    };
    
    console.log('📤 API would return:', config);
    
  } catch (error) {
    console.error('❌ Error testing admin config flow:', error);
    process.exit(1);
  }
}

testAdminConfigFlow().then(() => {
  console.log('\n🏁 Admin config flow test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Admin config flow test failed:', error);
  process.exit(1);
});
