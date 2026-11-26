const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_4055.js', 'utf8');
const p3Idx = content.indexOf('default:()=>M');
console.log(content.slice(p3Idx, p3Idx + 4500));
