import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

async function createTestUser() {
  try {
    const userId = randomUUID();
    const email = 'test@example.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      console.log('✓ Test user already exists');
      console.log('  Email: test@example.com');
      console.log('  Password: Password123!');
      return;
    }

    // Create test user
    await sql`
      INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, created_at, updated_at)
      VALUES (${userId}::uuid, ${email}, ${'0241234567'}, ${passwordHash}, ${'Test'}, ${'User'}, 50.00, true, ${'USER'}, ${now}::timestamp, ${now}::timestamp)
    `;

    console.log('✓ Test user created successfully!');
    console.log('  Email: test@example.com');
    console.log('  Password: Password123!');
    console.log('  Phone: 0241234567');
    console.log('  Wallet Balance: GHS 50.00');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
