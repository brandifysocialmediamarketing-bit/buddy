const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_4055.js', 'utf8');

const apiMatches = content.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
console.log('API matches in 4055:', apiMatches);

const jsonMatches = content.match(/https?:\/\/[^\s"']+\.json/g) || [];
console.log('JSON matches:', jsonMatches);
