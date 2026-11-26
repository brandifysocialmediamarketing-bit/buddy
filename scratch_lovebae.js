const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');
const allScripts = content.match(/\/static\/chunks\/[^"'\s]+/g) || [];
console.log('All scripts:', allScripts);
