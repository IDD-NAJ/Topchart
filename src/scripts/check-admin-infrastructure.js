const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
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

async function checkAdminPage() {
  loadEnvFile();
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    console.log('🔍 Checking admin page existence...');
    
    // Check if admin page route exists
    const adminPageRoute = './app/admin/page.tsx';
    const adminPageExists = fs.existsSync(adminPageRoute);
    
    console.log(`📁 Admin page exists: ${adminPageExists}`);
    
    if (adminPageExists) {
      console.log('✅ Admin page found at:', adminPageRoute);
      
      // Check if admin layout exists
      const adminLayoutRoute = './app/(admin)/layout.tsx';
      const adminLayoutExists = fs.existsSync(adminLayoutRoute);
      
      console.log(`📁 Admin layout exists: ${adminLayoutExists}`);
      
      // Check if admin API routes exist
      const adminApiDir = './app/api/admin';
      const adminApiExists = fs.existsSync(adminApiDir);
      
      console.log(`📁 Admin API directory exists: ${adminApiExists}`);
      
      // Check if admin components exist
      const adminComponentsDir = './components/admin';
      const adminComponentsExists = fs.existsSync(adminComponentsDir);
      
      console.log(`📁 Admin components directory exists: ${adminComponentsExists}`);
      
      console.log('📋 Admin infrastructure status:');
      console.log(`   ✅ Admin page: ${adminPageExists ? 'Found' : 'Missing'}`);
      console.log(`   ✅ Admin layout: ${adminLayoutExists ? 'Found' : 'Missing'}`);
      console.log(`   ✅ Admin API routes: ${adminApiExists ? 'Found' : 'Missing'}`);
      console.log(`   ✅ Admin components: ${adminComponentsExists ? 'Found' : 'Missing'}`);
      
      if (adminPageExists && adminLayoutExists && adminApiExists) {
        console.log('✅ Admin dashboard is fully implemented!');
      } else {
        console.log('❌ Admin dashboard is incomplete - missing components');
        console.log('   - Admin page:', adminPageExists ? '✅ Found' : '❌ Missing');
        console.log('   - Admin layout:', adminLayoutExists ? '✅ Found' : '❌ Missing');
        console.log('   - Admin API routes:', adminApiExists ? '✅ Found' : '❌ Missing');
        console.log('   - Admin components:', adminComponentsExists ? '✅ Found' : '❌ Missing');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking admin page:', error);
    process.exit(1);
  }
}

checkAdminPage().then(() => {
  console.log('🏁 Admin page check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Admin page check failed:', error);
  process.exit(1);
});
