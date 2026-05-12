require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function checkAdminUser() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Checking for admin users...\n');
    
    const users = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
      WHERE role = 'ADMIN'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (users.rows.length === 0) {
      console.log('No admin users found.');
      console.log('\nTo create an admin user:');
      console.log('1. Register a normal user via the app');
      console.log('2. Run this SQL in Neon dashboard:');
      console.log("   UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';");
    } else {
      console.log('Admin users found:');
      users.rows.forEach(u => {
        console.log(`  - ${u.email} (${u.first_name} ${u.last_name}) - role: ${u.role}`);
      });
    }
    
    // Also check auth_sessions table
    const sessions = await pool.query(`
      SELECT COUNT(*) as count FROM auth_sessions WHERE expires_at > NOW()
    `);
    console.log(`\nActive sessions: ${sessions.rows[0].count}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdminUser();
