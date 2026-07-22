/**
 * Verification Tables Migration Runner
 * Run this to create the missing verification_services and related tables
 * 
 * Usage: node src/scripts/run-verification-migration.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('✅ Environment variables loaded from .env.local\n');
  } catch (error) {
    console.log('⚠️  Could not load .env.local file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

// Read database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('Please make sure your .env.local file contains the DATABASE_URL');
  process.exit(1);
}

// Simple SQL splitter that respects dollar-quoted strings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function splitSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;
  
  while (i < sql.length) {
    const char = sql[i];
    
    // Check for dollar-quoted string start
    if (char === '$' && !inDollarQuote) {
      // Look ahead to find $tag$ pattern
      let j = i + 1;
      let tag = '';
      while (j < sql.length && sql[j] !== '$' && /[a-zA-Z_]/.test(sql[j])) {
        tag += sql[j];
        j++;
      }
      if (j < sql.length && sql[j] === '$') {
        inDollarQuote = true;
        dollarTag = tag;
        current += '$' + tag + '$';
        i = j + 1;
        continue;
      }
    }
    
    // Check for dollar-quoted string end: $tag$
    if (char === '$' && inDollarQuote) {
      const endMarker = '$' + dollarTag + '$';
      if (sql.slice(i, i + endMarker.length) === endMarker) {
        inDollarQuote = false;
        current += endMarker;
        i += endMarker.length;
        dollarTag = '';
        continue;
      }
    }
    
    // Statement terminator (only outside dollar quotes)
    if (char === ';' && !inDollarQuote) {
      current = current.trim();
      if (current.length > 0 && !current.startsWith('--')) {
        statements.push(current + ';');
      }
      current = '';
      i++;
      continue;
    }
    
    current += char;
    i++;
  }
  
  // Add final statement if exists
  current = current.trim();
  if (current.length > 0 && !current.startsWith('--')) {
    statements.push(current + ';');
  }
  
  return statements;
}

async function executeSQLFile(sqlClient, sql, fileName) {
  console.log(`\n📄 ${fileName}: Executing entire SQL file`);
  
  try {
    await sqlClient.unsafe(sql);
    console.log(`  ✅ Successfully executed ${fileName}`);
    return { successCount: 1, skipCount: 0, errorCount: 0 };
  } catch (err) {
    const errMsg = (err.message || err.toString()).toLowerCase();
    
    if (errMsg.includes('already exists') || errMsg.includes('duplicate')) {
      console.log(`  ⚠️  Already exists: ${errMsg.substring(0, 100)}`);
      return { successCount: 0, skipCount: 1, errorCount: 0 };
    } else {
      console.log(`  ❌ Error: ${errMsg.substring(0, 100)}`);
      return { successCount: 0, skipCount: 0, errorCount: 1 };
    }
  }
}

async function runMigration() {
  console.log('🔧 Running Verification Tables Migration for PVADeals...\n');
  
  try {
    const sql = neon(DATABASE_URL);
    
    // Test connection
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connection successful\n');
    } catch (e) {
      console.error('❌ Cannot connect to database:', e.message);
      process.exit(1);
    }
    
    const files = [
      '017a-create-core-tables.sql',
      '017b-create-indexes.sql', 
      '017c-seed-services.sql'
    ];
    
    let totalSuccess = 0;
    let totalSkip = 0;
    let totalError = 0;
    
    for (const file of files) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        continue;
      }
      
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const result = await executeSQLFile(sql, sqlContent, file);
      
      totalSuccess += result.successCount;
      totalSkip += result.skipCount;
      totalError += result.errorCount;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Total Migration Summary:');
    console.log(`   ✅ Successful: ${totalSuccess}`);
    console.log(`   ⚠️  Skipped (already exists): ${totalSkip}`);
    console.log(`   ❌ Failed: ${totalError}`);
    console.log('='.repeat(50));
    
    if (totalError === 0) {
      console.log('\n🎉 Migration completed successfully!\n');
    } else {
      console.log(`\n⚠️  Migration completed with ${totalError} errors.\n`);
    }
    
    console.log('Next steps:');
    console.log('1. 🔄 Restart your Next.js dev server (Ctrl+C, then npm run dev)');
    console.log('2. 🌐 Go to /admin/verification');
    console.log('3. 🔄 Click "Sync Services" to load live data from PVADeals');
    console.log('4. 💰 Go to /admin/verification/pricing to configure markups\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('🏁 Migration runner finished\n');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration runner failed:', error);
  process.exit(1);
});
