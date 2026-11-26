const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('d:/BUDDY/extracted_lovebae_tod.json', 'utf8'));

function isQuestion(q) {
  return q.endsWith('?') || /^(what|when|where|who|why|how|if|have|has|do|did|would|could|is|are|name|describe|tell)\b/i.test(q);
}

const slices = [
  { level: 'sweet', start: 0, end: 152 },
  { level: 'flirty', start: 152, end: 304 },
  { level: 'spicy', start: 304, end: 456 },
  { level: 'extreme', start: 456, end: questions.length }
];

const database = {
  sweet: { truths: [], dares: [] },
  flirty: { truths: [], dares: [] },
  spicy: { truths: [], dares: [] },
  extreme: { truths: [], dares: [] }
};

slices.forEach(s => {
  const subset = questions.slice(s.start, s.end);
  subset.forEach(item => {
    if (isQuestion(item)) {
      database[s.level].truths.push(item);
    } else {
      database[s.level].dares.push(item);
    }
  });
});

console.log('Categorization summary:');
Object.keys(database).forEach(lvl => {
  console.log(`${lvl}: ${database[lvl].truths.length} truths, ${database[lvl].dares.length} dares (Total: ${database[lvl].truths.length + database[lvl].dares.length})`);
});

const outJs = `/**
 * BUDDY - truth-or-dare-data.js
 * 600+ Romantic & Exciting Truths and Dares across 4 Vibes:
 * Sweet 💕 • Flirty 😏 • Spicy 🌶️ • Extreme 🔥
 */
window.TruthOrDareData = ${JSON.stringify(database, null, 2)};
`;

fs.writeFileSync('d:/BUDDY/js/truth-or-dare-data.js', outJs);
console.log('Saved to d:/BUDDY/js/truth-or-dare-data.js');
