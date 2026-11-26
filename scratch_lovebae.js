const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('d:/BUDDY/extracted_lovebae_tod.json', 'utf8'));

console.log('0-10:', questions.slice(0, 5));
console.log('150-155:', questions.slice(150, 155));
console.log('300-305:', questions.slice(300, 305));
console.log('450-455:', questions.slice(450, 455));
console.log('580-585:', questions.slice(580, 585));
