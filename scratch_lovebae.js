const fs = require('fs');
const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');

const target = '"numberOfItems":606,"itemListElement":[';
const idx = content.indexOf(target);
if (idx !== -1) {
  const jsonSub = content.slice(idx + target.length - 1);
  // Find closing of array
  let depth = 0;
  let endPos = -1;
  for (let i = 0; i < jsonSub.length; i++) {
    if (jsonSub[i] === '[') depth++;
    else if (jsonSub[i] === ']') {
      depth--;
      if (depth === 0) {
        endPos = i;
        break;
      }
    }
  }

  if (endPos !== -1) {
    const arr = JSON.parse(jsonSub.slice(0, endPos + 1));
    console.log('Parsed successfully! Item count:', arr.length);
    const questions = arr.map(x => x.name);
    fs.writeFileSync('d:/BUDDY/extracted_lovebae_tod.json', JSON.stringify(questions, null, 2));
    console.log('Sample questions:', questions.slice(0, 5));
  }
}
