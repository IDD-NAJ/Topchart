/**
 * Build Sanitization Script
 *
 * Scans the client-side static chunks for localhost/127.0.0.1 references
 * that could cause CSP violations in the browser. Server-side bundles are
 * intentionally excluded — Node.js packages like nodemailer legitimately use
 * 127.0.0.1 for SMTP/TCP connections which never reach the browser.
 */

const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.join(__dirname, '..', '.next', 'static');

const SKIP_EXTENSIONS = ['.map', '.json', '.css'];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(STATIC_DIR);
let found = false;

for (const f of files) {
  const ext = path.extname(f);
  if (SKIP_EXTENSIONS.includes(ext)) continue;

  let content;
  try {
    content = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }

  if (!content.includes('127.0.0.1')) continue;

  console.error(`Error: Found 127.0.0.1 in client bundle: ${path.relative(process.cwd(), f)}`);
  found = true;
}

if (found) {
  console.error('\nBuild failed: localhost IP found in client-side output. This would cause CSP violations.');
  process.exit(1);
} else {
  console.log('Build sanitization passed: No localhost references found in client bundles.');
}
