const http = require('http');

async function testAPI(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data.substring(0, 500) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('Testing API endpoints...\n');
  
  const endpoints = [
    '/api/navigation',
    '/api/homepage/services',
    '/api/homepage/faqs',
    '/api/homepage/testimonials',
    '/api/service-status',
    '/api/content/header-logo',
  ];

  for (const path of endpoints) {
    try {
      const result = await testAPI(path);
      const success = result.status === 200 && result.data?.success !== false;
      const symbol = success ? '✓' : '✗';
      console.log(`${symbol} ${path}: ${result.status}`);
      if (!success && result.data?.error) {
        console.log(`   Error: ${result.data.error}`);
      } else if (success && result.data?.links) {
        console.log(`   Links: ${result.data.links.length}`);
      } else if (success && result.data?.services) {
        console.log(`   Services: ${result.data.services.length}`);
      } else if (success && result.data?.faqs) {
        console.log(`   FAQs: ${result.data.faqs.length}`);
      } else if (success && result.data?.testimonials) {
        console.log(`   Testimonials: ${result.data.testimonials.length}`);
      }
    } catch (err) {
      console.log(`✗ ${path}: ${err.message}`);
    }
  }
}

main();
