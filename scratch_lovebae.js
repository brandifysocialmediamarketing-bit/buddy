const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('d:/BUDDY/extracted_lovebae_tod.json', 'utf8'));

console.log('Total items:', questions.length);

// Check if some start with action verbs (Dares) vs question words (Truths)
const truths = [];
const dares = [];

questions.forEach(q => {
  // Typical dare indicators: imperative verbs e.g. Kiss, Whisper, Send, Give, Massage, Do, Let, Hold, Dance, Feed, Blindfold, Take off, Lick, Nibble, etc.
  const isQuestion = q.endsWith('?') || /^(what|when|where|who|why|how|if|have|has|do|did|would|could|is|are|name|describe|tell)\b/i.test(q);
  if (isQuestion) {
    truths.push(q);
  } else {
    dares.push(q);
  }
});

console.log('Truths count:', truths.length);
console.log('Dares count:', dares.length);
console.log('Sample Truths:', truths.slice(0, 3));
console.log('Sample Dares:', dares.slice(0, 3));
