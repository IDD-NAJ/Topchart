const key = process.env.DATAMART_API_KEY || '';
const base = 'https://api.datamartgh.shop';

const headers = [
  { Authorization: `Token ${key}`, 'Content-Type': 'application/json' },
  { 'x-api-key': key, 'Content-Type': 'application/json' },
  { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  { 'api-key': key, 'Content-Type': 'application/json' },
];

const paths = [
  // Possible short prefixes
  '/reseller/data', '/reseller/airtime', '/reseller/user', '/reseller/network',
  '/reseller/data/plans', '/reseller/airtime/buy',
  '/vtu/data', '/vtu/airtime', '/vtu/user',
  '/ghana/data', '/ghana/airtime',
  '/api/reseller', '/api/vtu',
  // Possible full paths
  '/buy-data', '/buy-airtime', '/get-plans', '/get-networks', '/get-user',
  '/fetch-plans', '/fetch-data', '/fetch-networks',
  '/data-bundle', '/data-bundles', '/bundle',
  '/mtn', '/telecel', '/airteltigo',
  '/services', '/service', '/categories',
  // Django-style without trailing slash
  '/api/user', '/api/data', '/api/network', '/api/topup',
  // Possible REST style
  '/rest/data', '/rest/user', '/rest/airtime',
];

async function probe() {
  if (!key) {
    throw new Error('Set DATAMART_API_KEY before running this script');
  }
  // First try all paths with the primary auth header
  const hdr = headers[0];
  let hitsFound = false;
  for (const path of paths) {
    const url = base + path;
    try {
      const res = await fetch(url, { headers: hdr, signal: AbortSignal.timeout(4000) });
      const text = await res.text();
      if (res.status !== 404) {
        hitsFound = true;
        console.log(`\n✅ ${res.status} HIT: ${path}`);
        console.log('Body:', text.substring(0, 300));
      }
    } catch(e) {}
  }

  // Try different auth methods on /api/user/ (known path from old code)
  console.log('\n\n=== Testing auth methods on /api/user/ ===');
  for (const h of headers) {
    const url = base + '/api/user/';
    const res = await fetch(url, { headers: h, signal: AbortSignal.timeout(4000) });
    const text = await res.text();
    console.log(`Auth: ${JSON.stringify(h).substring(0,50)} -> ${res.status}: ${text.substring(0, 150)}`);
  }

  // Also try no auth at all
  {
    const url = base + '/api/user/';
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const text = await res.text();
    console.log(`No auth -> ${res.status}: ${text.substring(0, 150)}`);
  }

  if (!hitsFound) console.log('\nNo non-404 hits found with any path tried.');
}

probe().catch(console.error);
