const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('.next');
let found = false;
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('127.0.0.1')) {
      console.error(`Error: Found 127.0.0.1 reference in build output file: ${f}`);
      found = true;
    }
  } catch (err) {
    // ignore unreadable files
  }
});

if (found) {
  console.error("Build failed due to localhost dependencies.");
  process.exit(1);
} else {
  console.log("Build sanitization passed: No 127.0.0.1 references found.");
}
