const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');

// Find the schema.org itemListElement block
const startIdx = content.indexOf('"itemListElement":[');
if (startIdx !== -1) {
  const jsonStr = content.slice(startIdx + 18);
  const endIdx = jsonStr.indexOf(']');
  const items = JSON.parse('[' + jsonStr.slice(0, endIdx) + ']');
  console.log('Successfully extracted items count:', items.length);
  const questions = items.map(it => it.name);
  fs.writeFileSync('d:/BUDDY/extracted_lovebae_tod.json', JSON.stringify(questions, null, 2));
  console.log('Sample 10 items:');
  console.log(questions.slice(0, 10));
} else {
  console.log('itemListElement not found');
}
