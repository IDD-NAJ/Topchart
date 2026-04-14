const key = process.env.DATAMART_API_KEY || '';
const urls = [
  'https://www.datamartgh.shop/api/user/',
  'https://www.datamartgh.shop/api/data/',
  'https://www.datamartgh.shop/api/network/'
];

async function probe() {
  if (!key) {
    throw new Error('Set DATAMART_API_KEY before running this script');
  }
  for (let url of urls) {
    console.log('\\n---------------------');
    console.log('Fetching', url);
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Token ${key}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Status (Token Auth):', res.status);
      const text = await res.text();
      console.log('Body:', text.substring(0, 300));

      if (res.status === 401 || res.status === 403 || text.includes("credentials")) {
        console.log("Trying Bearer auth...");
        const res2 = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Status (Bearer Auth):', res2.status);
        const text2 = await res2.text();
        console.log('Body:', text2.substring(0, 300));
      }
    } catch(e) {
      console.error('Error:', e.message);
    }
  }
}
probe();
