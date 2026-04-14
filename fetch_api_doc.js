const key = process.env.DATAMART_API_KEY || '';
const base = 'https://api.datamartgh.shop';

// The API is running Express/Node with MongoDB.
// Try fetching the api-doc page from the WEBSITE (www.) to see documented endpoints
async function fetchApiDoc() {
  const urls = [
    'https://www.datamartgh.shop/api-doc',
    'https://datamartgh.shop/api-doc',
    'https://datamartgh.shop/developer',
    'https://datamartgh.shop/documentation',
  ];

  for (const url of urls) {
    console.log('\n--- Fetching:', url);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(6000)
      });
      console.log('Status:', res.status);
      if (res.status === 200) {
        const text = await res.text();
        // Look for API endpoint patterns
        const apiPaths = text.match(/["'`\/](\/[a-z][a-z0-9/_-]{2,60})["'`\s]/gi) || [];
        console.log('API paths found:');
        const unique = [...new Set(apiPaths.map(p => p.replace(/["'`\s]/g, '')))];
        unique.filter(p => !p.includes('_next') && !p.includes('static') && !p.includes('.js') && !p.includes('.css')).forEach(p => console.log(' ', p));
      }
    } catch(e) {
      console.log('Error:', e.message);
    }
  }
}

// Also try to get the full __NEXT_DATA__ from www.datamartgh.shop/api-doc
async function fetchNextData() {
  const url = 'https://www.datamartgh.shop/api-doc';
  console.log('\n--- Scraping NEXT_DATA from', url);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (res.status === 200) {
      const html = await res.text();
      const start = html.indexOf('__NEXT_DATA__');
      if (start !== -1) {
        const jsonStart = html.indexOf('{', start);
        const jsonEnd = html.indexOf('</script>', start);
        const raw = html.substring(jsonStart, jsonEnd);
        try {
          const data = JSON.parse(raw);
          console.log(JSON.stringify(data.props?.pageProps || data, null, 2).substring(0, 3000));
        } catch {
          console.log('Raw:', raw.substring(0, 1000));
        }
      } else {
        // Find any embedded JSON with endpoint info
        const endpoints = html.match(/"(\/[a-z][a-z0-9\/_-]{3,60})"/g) || [];
        const unique = [...new Set(endpoints)];
        console.log('Embedded paths:');
        unique.filter(p => !p.includes('_next') && !p.includes('static')).forEach(p => console.log(p));
        
        // Save HTML for inspection
        require('fs').writeFileSync('api_doc_page.html', html);
        console.log('Saved HTML to api_doc_page.html (' + html.length + ' bytes)');
      }
    } else {
      console.log('Status:', res.status);
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
}

fetchApiDoc().then(fetchNextData).catch(console.error);
