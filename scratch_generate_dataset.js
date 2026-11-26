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

// Supplement Spicy Dares & Extreme Truths for balanced endless replayability:
const extraSpicyDares = [
  "Slowly run your fingers through your partner's hair while looking into their eyes.",
  "Give your partner a 60-second sensual shoulder and neck massage.",
  "Whisper your deepest romantic fantasy into your partner's ear.",
  "Plant a slow kiss on your partner's collarbone.",
  "Hold your partner by their waist and pull them close for 20 seconds.",
  "Trace your lips along your partner's jawline without making a sound.",
  "Feed your partner a piece of fruit or chocolate using only your mouth.",
  "Kiss every fingertip on your partner's hand slowly.",
  "Rest your forehead against your partner's and share 3 intense eye-contact breaths.",
  "Leave a soft kiss on your partner's neck right beneath their ear.",
  "Put your favorite slow romantic track on and slow dance holding each other tight.",
  "Gently blindfold your partner with your hands and kiss them somewhere unexpected.",
  "Take your partner's hands, place them on your chest, and say how fast your heart is beating.",
  "Whisper what you find most irresistible about your partner right now.",
  "Kiss your partner's lips, but take 10 seconds to make contact."
];

const extraExtremeTruths = [
  "What is the single wildest thing you've ever imagined doing together behind closed doors?",
  "If tonight had zero rules, what is the first thing you would ask me to do for you?",
  "What's a secret turn-on you get when watching me do everyday things?",
  "Have you ever had a steamy dream about us that made you blush the next morning?",
  "What is your absolute favorite spot on your body to be kissed or touched?",
  "Which outfit or look of mine makes you lose your self-control the fastest?",
  "If we rented a private hotel room with no distractions for 24 hours, how would we spend it?",
  "What is something adventurous in bed you have always wanted to try but were shy to ask?",
  "What was the most intense moment of romantic tension we ever shared?",
  "What is a sensual compliment you want to hear from me more often?",
  "How long can you usually hold back when we are being deeply intimate?",
  "What is the most seductive thing I do without even realizing it?"
];

database.spicy.dares.push(...extraSpicyDares);
database.extreme.truths.push(...extraExtremeTruths);

const outJs = `/**
 * BUDDY - truth-or-dare-data.js
 * Complete Romantic & Exciting Truths and Dares across 4 Vibes:
 * Sweet 💕 • Flirty 😏 • Spicy 🌶️ • Extreme 🔥
 */
window.TruthOrDareData = ${JSON.stringify(database, null, 2)};
`;

fs.writeFileSync('d:/BUDDY/js/truth-or-dare-data.js', outJs);
console.log('Complete database written with extra supplements!');
