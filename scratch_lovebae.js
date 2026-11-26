const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_4055.js', 'utf8');
console.log('Includes Truth:', content.includes('Truth'));
console.log('Includes Dare:', content.includes('Dare'));

// Find strings or interesting functions
const strings = content.match(/"([^"]{15,100})"/g) || [];
console.log('Sample strings:', strings.slice(0, 30));
