/**
 * Test script to verify Reloadly API connection
 * Run with: node test-reloadly.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    return {};
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!key || valueParts.length === 0) continue;
    const value = valueParts.join('=').trim();
    env[key.trim()] = value.replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnvLocal();
const RELOADLY_CLIENT_ID = env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = env.RELOADLY_CLIENT_SECRET;
const RELOADLY_SANDBOX = env.RELOADLY_SANDBOX === 'true';

console.log('Testing Reloadly API connection...');
console.log('Client ID:', RELOADLY_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('Client Secret:', RELOADLY_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
console.log('Sandbox Mode:', RELOADLY_SANDBOX);

if (!RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET) {
  console.error('ERROR: RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET must be set');
  process.exit(1);
}

async function testAuth() {
  const authUrl = RELOADLY_SANDBOX 
    ? "https://auth.reloadly.com/oauth/token"
    : "https://auth.reloadly.com/oauth/token";

  console.log('\n1. Testing authentication...');
  console.log('Auth URL:', authUrl);

  try {
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: RELOADLY_CLIENT_ID,
        client_secret: RELOADLY_CLIENT_SECRET,
        grant_type: "client_credentials",
        audience: "https://giftcards.reloadly.com",
      }),
    });

    console.log('Auth response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth FAILED:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('Auth SUCCESS ✓');
    console.log('Access token received:', data.access_token ? '✓' : '✗');
    console.log('Expires in:', data.expires_in, 'seconds');
    
    return data.access_token;
  } catch (error) {
    console.error('Auth ERROR:', error.message);
    return null;
  }
}

async function testProducts(token) {
  const baseUrl = "https://giftcards.reloadly.com";

  console.log('\n2. Testing products fetch...');
  console.log('Base URL:', baseUrl);

  try {
    const response = await fetch(`${baseUrl}/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log('Products response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Products fetch FAILED:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('Products fetch SUCCESS ✓');
    console.log('Products returned:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\nSample product:');
      console.log('- Name:', data[0].productName);
      console.log('- Brand:', data[0].brandName);
      console.log('- Country:', data[0].countryIsoName);
      console.log('- Denomination:', data[0].minRecipientDenomination);
    }
    
    return data;
  } catch (error) {
    console.error('Products fetch ERROR:', error.message);
    return null;
  }
}

async function main() {
  const token = await testAuth();
  
  if (!token) {
    console.error('\n❌ Authentication failed. Cannot proceed with products test.');
    process.exit(1);
  }

  const products = await testProducts(token);
  
  if (!products) {
    console.error('\n❌ Products fetch failed.');
    process.exit(1);
  }

  console.log('\n✅ All tests passed!');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
