const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');
const regex = /\/_next\/static\/chunks\/[a-zA-Z0-9_-]+\.js/g;
const chunks = [...new Set(content.match(regex) || [])];
console.log('Found chunks:', chunks.length);
chunks.forEach(c => console.log('Chunk:', c));
