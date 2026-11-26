const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_4055.js', 'utf8');

// Print sections
const parts = content.split(';a.d(');
parts.forEach((p, i) => {
  console.log(`--- PART ${i} ---`);
  console.log(p.slice(0, 1500));
});
