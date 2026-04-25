const fs = require('fs');
const key = process.env.DATAMART_API_KEY || '';
const base = 'https://api.datamartgh.shop';

async function scanHtml() {
  const html = fs.readFileSync('doc.html', 'utf8');
  const pattern = /https:\/\/api\.datamartgh\.shop[^"'\s<>]*/g;
  const matches = html.match(pattern) || [];
  const unique = [...new Set(matches)];
  console.log('=== URLs found in doc.html referencing api.datamartgh.shop ===');
  unique.forEach(u => console.log(u));

  const scriptPattern = /["'`](\/[a-z][a-z0-9/_-]{1,50})["'`]/g;
  let m;
  const paths = new Set();
  while ((m = scriptPattern.exec(html)) !== null) {
    const p = m[1];
    if (!p.includes('_next') && !p.includes('static') && !p.includes('.js') && !p.includes('.css')) {
      paths.add(p);
    }
  }
  console.log('\n=== Path-like strings in doc.html ===');
  [...paths].forEach(p => console.log(p));
}

async function probePaths() {
  if (!key) {
    throw new Error('Set DATAMART_API_KEY before running this script');
  }
  const paths = [
    '/api/data/', '/api/user/', '/api/network/', '/api/topup/',
    '/api/data', '/api/user', '/api/network', '/api/topup',
    '/data/', '/user/', '/network/', '/topup/', '/airtime/',
    '/api/v1/data/', '/api/v1/user/', '/api/v1/network/', '/api/v1/topup/',
    '/api/v2/data/', '/api/v2/user/', '/api/v2/network/',
    '/v1/data/', '/v1/user/', '/v1/network/', '/v1/topup/',
  ];

  console.log('\n=== Probing paths on api.datamartgh.shop ===');
  for (const path of paths) {
    const url = base + path;
    try {
      const res = await fetch(url, {
        headers: { Authorization: 'Token ' + key, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      const text = await res.text();
      console.log(res.status + ' ' + path + ' -> ' + text.substring(0, 200));
    } catch(e) {
      console.log('ERR ' + path + ': ' + e.message);
    }
  }
}

scanHtml().then(probePaths).catch(console.error);
