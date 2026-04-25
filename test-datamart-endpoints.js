const base = 'https://api.datamartgh.shop';
const key = process.env.DATAMART_API_KEY || '';

async function testEndpoints() {
  const endpoints = [
    '/api/v1/me/',
    '/api/v1/networks/',
    '/api/v1/plans/',
    '/api/v1/data-plans/',
    '/api/v1/data/',
    '/api/v1/airtime/',
    '/api/user/',
    '/api/networks/',
    '/api/plans/',
    '/api/data/',
    '/api/airtime/',
    '/api/v1/data/bundles/',
    '/api/data/bundles/',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(base + endpoint, {
        headers: {
          'Authorization': `Token ${key}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      console.log(endpoint, res.status, res.statusText);
      if (res.status === 200) {
        const data = await res.json();
        console.log('  Response:', JSON.stringify(data).substring(0, 200));
      }
    } catch(e) {
      console.log(endpoint, 'ERROR:', e.message);
    }
  }
}

testEndpoints();
