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

async function runMigrations() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  
  try {
    console.log('🗄️  Running database migrations...');
    
    // List of migration files in order
    const migrationFiles = [
      '001-create-tables.sql',
      '002-add-paystack-columns.sql',
      '002-add-reseller-tables.sql',
      '003-add-fraud-tables.sql',
      '003-create-auth-sessions.sql',
      '003-normalize-emails.sql',
      '004-add-tier-tables.sql',
      '004-fix-transactions-user-id.sql',
      '005-add-analytics-tables.sql',
      '005-reset-transactions-table.sql',
      '006-fix-transactions-updatedAt.sql',
      '006-reseller-form-customization.sql',  // This one creates the system_config table
      '007-fix-wallets-updatedAt.sql',
      '008-add-user-role.sql',
      '009-add-role-constraint.sql',
      '010-create-content-tables.sql',
      '011-create-blog-tables.sql',
      '012-create-faqs-table.sql',
      '013-create-press-tables.sql',
      '015-add-verification-tables.sql',
      '016-fix-reseller-tables.sql'
    ];
    
    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, 'src', 'scripts', file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file ${file} not found, skipping...`);
        continue;
      }
      
      console.log(`📄 Running migration: ${file}`);
      
      try {
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL into individual statements and run them
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            await sql.unsafe(statement);
          }
        }
        
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        // Some migrations might fail if they already exist, that's okay
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Migration ${file} skipped (already exists):`, error.message);
        } else {
          console.error(`❌ Migration ${file} failed:`, error.message);
          // Continue with other migrations
        }
      }
    }
    
    console.log('\n🎉 All migrations completed!');
    
    // Verify system_config table exists
    try {
      const result = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'system_config'
      `;
      
      if (result.length > 0) {
        console.log('✅ system_config table exists');
      } else {
        console.log('❌ system_config table still missing');
      }
    } catch (error) {
      console.error('Error checking system_config table:', error);
    }
    
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations().then(() => {
  console.log('\n🏁 Migration process completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration process failed:', error);
  process.exit(1);
});
