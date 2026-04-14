const fs = require('fs');

try {
  let html = fs.readFileSync('doc.html', 'utf8');

  // Look for the NextJS data script tag
  let startMark = '<script id="__NEXT_DATA__" type="application/json">';
  let startIndex = html.indexOf(startMark);
  
  if (startIndex === -1) {
    console.log("No Next.js data found. Searching for generic swagger/api terms...");
    let matches = html.match(/.{0,50}api.{0,50}/gi);
    if(matches) {
       console.log("Matches:", matches.slice(0, 10));
    }
  } else {
    let contentStart = startIndex + startMark.length;
    let endIndex = html.indexOf('</script>', contentStart);
    let jsonString = html.substring(contentStart, endIndex);
    
    let db = JSON.parse(jsonString);
    console.log(JSON.stringify(db.props.pageProps, null, 2));
  }
} catch(e) {
  console.log("Error generating doc:", e.message);
}
