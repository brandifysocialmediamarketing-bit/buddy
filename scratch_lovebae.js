const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');

const regex = /"truths":\{.*?\}/;
const m = content.match(regex);
if (m) {
  console.log('Found truths match length:', m[0].length);
  fs.writeFileSync('d:/BUDDY/truths_sample.json', m[0]);
} else {
  console.log('No direct truths match, searching for "favorite memory"');
  const idx = content.indexOf('favorite memory');
  console.log(content.slice(Math.max(0, idx - 200), idx + 400));
}
