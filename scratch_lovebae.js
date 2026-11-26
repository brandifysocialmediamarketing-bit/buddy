const fs = require('fs');

async function checkChunks() {
  const chunks = [
    '5085-660b21dabce1f1c7.js',
    '7117-9f8d4fef12c2e38b.js',
    '4053-7aa682d26bf51f19.js',
    '9966-ddc52ffa141f179e.js',
    '6772-fa612e0781729b7d.js',
    '9026-018feb1658709910.js',
    '4745-444645c74097fe6c.js',
    '8633-cb40af88ea51d93b.js',
    '8121-53cb6e6659fb9514.js',
    '4210-5068288d9b5f741b.js',
    '3426-6c2f6f042296eda6.js',
    '3536-c783eb829fbe5ec0.js',
    '4055-d41c046ca26cd47e.js'
  ];

  for (const c of chunks) {
    try {
      const res = await fetch('https://lovebae.app/_next/static/chunks/' + c);
      const text = await res.text();
      if (text.includes('Pick your vibe') || text.includes('truths & dares') || text.includes('Sweet') && text.includes('Spicy')) {
        console.log('>>> MATCH IN CHUNK:', c, 'length:', text.length);
        fs.writeFileSync('d:/BUDDY/lovebae_game_chunk.js', text);
      }
    } catch (e) {
      console.log('Err:', e.message);
    }
  }
}

checkChunks();
