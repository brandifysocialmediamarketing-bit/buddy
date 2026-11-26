const fs = require('fs');

async function fetch4055() {
  const url = 'https://lovebae.app/_next/static/chunks/4055-d41c046ca26cd47e.js';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const text = await res.text();
  console.log('Fetched 4055, length:', text.length);
  fs.writeFileSync('d:/BUDDY/lovebae_4055.js', text);
}

fetch4055();
