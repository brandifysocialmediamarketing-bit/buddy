const fs = require('fs');

async function extractQuestions() {
  const content = fs.readFileSync('d:/BUDDY/lovebae_dump.html', 'utf8');
  // Check if questions are in the dump or in a json/chunk
  const matches = content.match(/"text":"([^"]+)"/g) || [];
  console.log('Text matches in dump:', matches.length);
  if (matches.length > 0) {
    console.log('Sample:', matches.slice(0, 10));
  }
}

extractQuestions();
