const fs = require('fs');

async function fetchPageChunk() {
  const url = 'https://lovebae.app/_next/static/chunks/app/games/truth-or-dare/page-e34ed21b084a1cf9.js';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const text = await res.text();
  console.log('Fetched page chunk, length:', text.length);
  fs.writeFileSync('d:/BUDDY/lovebae_tod_page.js', text);
}

fetchPageChunk();
