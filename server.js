const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3456;
const ROOT = path.resolve(__dirname);

const MIME = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  ico: 'image/x-icon'
};

// Helper: Resolve webpage or short link (like Pinterest pin.it) to direct image URL
function resolveImageUrl(rawUrl, callback, depth = 0) {
  if (depth > 6) return callback(new Error('Too many redirects'));

  let target;
  try {
    target = new URL(rawUrl);
  } catch (e) {
    return callback(new Error('Invalid URL'));
  }

  const client = target.protocol === 'https:' ? https : http;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  };

  const req = client.get(target, options, (res) => {
    // 1. Follow HTTP Redirects (301, 302, 307, 308)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let nextUrl = res.headers.location;
      if (nextUrl.startsWith('/')) {
        nextUrl = target.origin + nextUrl;
      }
      return resolveImageUrl(nextUrl, callback, depth + 1);
    }

    const contentType = (res.headers['content-type'] || '').toLowerCase();

    // 2. Direct Image Content
    if (contentType.startsWith('image/')) {
      return callback(null, rawUrl);
    }

    // 3. Webpage HTML: Parse for image metadata (Pinterest, Instagram, OpenGraph, etc.)
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) req.destroy();
    });

    res.on('end', () => {
      // Check og:image or twitter:image
      const ogMatch = body.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                      body.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
                      body.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      
      // Look for Pinterest original / high-res pinimg
      const pinImgOriginal = body.match(/https:\/\/[^"'\s]+\.pinimg\.com\/originals\/[^"'\s]+\.(jpg|jpeg|png|webp)/i);
      const pinImg736 = body.match(/https:\/\/[^"'\s]+\.pinimg\.com\/736x\/[^"'\s]+\.(jpg|jpeg|png|webp)/i);
      const pinImgGeneral = body.match(/https:\/\/[^"'\s]+\.pinimg\.com\/[^"'\s]+\.(jpg|jpeg|png|webp)/i);

      let found = null;
      if (pinImgOriginal) {
        found = pinImgOriginal[0];
      } else if (ogMatch && ogMatch[1] && !ogMatch[1].includes('favicon') && !ogMatch[1].includes('logo')) {
        found = ogMatch[1];
      } else if (pinImg736) {
        found = pinImg736[0];
      } else if (pinImgGeneral) {
        found = pinImgGeneral[0];
      }

      if (found) {
        found = found.replace(/&amp;/g, '&');
        return callback(null, found);
      }

      callback(new Error('Could not find image in page'));
    });
  });

  req.on('error', (err) => callback(err));
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Live Reload Clients
let sseClients = [];

// Watch directory for automatic live reload (Local development only)
let reloadTimer = null;
if (!isVercel) {
  try {
    fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const norm = filename.replace(/\\/g, '/').toLowerCase();
      // Do NOT reload for data storage, json files, logs, or node_modules
      if (
        norm.includes('node_modules') ||
        norm.includes('.git') ||
        norm.includes('data/') ||
        norm.startsWith('data') ||
        norm.endsWith('.json') ||
        norm.endsWith('.log') ||
        norm.endsWith('.tmp')
      ) {
        return;
      }
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        console.log(`[BUDDY Live-Reload] Change detected in ${filename}, updating connected apps...`);
        sseClients.forEach(client => {
          try { client.write('data: reload\n\n'); } catch (e) { }
        });
      }, 250);
    });
  } catch (e) {
    console.warn('[BUDDY] fs.watch notice:', e.message);
  }
}

// ── UNIVERSAL REQUEST BODY HELPER (Works in Local Node & Vercel Serverless) ──
function getRequestBody(req, callback) {
  // If Vercel or intermediate middleware already parsed req.body
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') {
      return callback(null, req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return callback(null, JSON.parse(req.body));
      } catch (err) {
        return callback(err, null);
      }
    }
  }

  // Otherwise read raw stream
  let raw = '';
  req.on('data', chunk => raw += chunk);
  req.on('end', () => {
    if (!raw) return callback(null, {});
    try {
      const parsed = JSON.parse(raw);
      callback(null, parsed);
    } catch (err) {
      callback(err, null);
    }
  });
  req.on('error', err => callback(err, null));
}

// ── GAMES DATA STORE & API (Don't Block Me & Future Games) ──
const QUIZZES_FILE = isVercel
  ? path.join('/tmp', 'games_quizzes.json')
  : path.join(ROOT, 'data', 'games_quizzes.json');

function loadQuizzes() {
  try {
    if (fs.existsSync(QUIZZES_FILE)) {
      return JSON.parse(fs.readFileSync(QUIZZES_FILE, 'utf8'));
    }
    // Seed initial quizzes data on Vercel from ROOT/data if available
    if (isVercel) {
      const seedFile = path.join(ROOT, 'data', 'games_quizzes.json');
      if (fs.existsSync(seedFile)) {
        const seedData = fs.readFileSync(seedFile, 'utf8');
        try { fs.writeFileSync(QUIZZES_FILE, seedData, 'utf8'); } catch(e){}
        return JSON.parse(seedData);
      }
    }
  } catch (e) {
    console.warn('Error reading quizzes file:', e);
  }
  return {};
}

function saveQuizzes(quizzes) {
  try {
    const dir = path.dirname(QUIZZES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving quizzes file:', e);
  }
}

// Handler for /api/games/quiz
function handleGamesApi(req, res, reqPath, parsedUrl) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. Create a new Quiz
  if (reqPath === '/api/games/quiz' && req.method === 'POST') {
    getRequestBody(req, (err, payload) => {
      try {
        if (err || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
        const { creatorName, questions, creatorAnswers } = payload;
        if (!creatorName || !Array.isArray(questions) || questions.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid quiz payload' }));
        }

        const quizId = 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const adminKey = 'adm_' + Math.random().toString(36).slice(2, 10);

        const quizzes = loadQuizzes();
        quizzes[quizId] = {
          id: quizId,
          adminKey,
          creatorName: creatorName.slice(0, 15).trim(),
          questions,
          creatorAnswers: creatorAnswers || [],
          createdAt: Date.now(),
          attempts: []
        };
        saveQuizzes(quizzes);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          quizId,
          adminKey
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  // 2. Get Quiz for friend playing
  if (reqPath === '/api/games/quiz' && req.method === 'GET') {
    const quizId = parsedUrl.searchParams.get('id');
    if (!quizId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing quiz id' }));
    }

    const quizzes = loadQuizzes();
    const quiz = quizzes[quizId];
    if (!quiz) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
    }

    // Return quiz details for playing WITHOUT exposing answers upfront (preserves privacy)
    const sanitizedQuestions = (quiz.questions || []).map(q => ({
      id: q.id,
      title: q.title,
      options: q.options
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      quiz: {
        id: quiz.id,
        creatorName: quiz.creatorName,
        questions: sanitizedQuestions,
        createdAt: quiz.createdAt
      }
    }));
  }

  // 2b. Check single answer for instant feedback without exposing remaining quiz answers
  if (reqPath === '/api/games/quiz/check-answer' && req.method === 'POST') {
    getRequestBody(req, (err, payload) => {
      try {
        if (err || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
        const { quizId, questionIndex, chosenIndex } = payload;
        const quizzes = loadQuizzes();
        const quiz = quizzes[quizId];
        if (!quiz) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
        }

        const qIdx = Number(questionIndex);
        const cIdx = Number(chosenIndex);
        let correctIndex = undefined;
        if (Array.isArray(quiz.creatorAnswers) && quiz.creatorAnswers[qIdx] !== undefined) {
          correctIndex = quiz.creatorAnswers[qIdx];
        } else if (quiz.questions && quiz.questions[qIdx] && quiz.questions[qIdx].correctIndex !== undefined) {
          correctIndex = quiz.questions[qIdx].correctIndex;
        }

        const isMatch = (correctIndex !== undefined && cIdx === correctIndex);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          isMatch,
          correctIndex
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  // 3. Friend submits Quiz attempt
  if (reqPath === '/api/games/quiz/submit' && req.method === 'POST') {
    getRequestBody(req, (err, payload) => {
      try {
        if (err || !payload) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
        const { quizId, playerName, score, totalQuestions, percentage, answers } = payload;
        if (!quizId || !playerName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Missing quizId or playerName' }));
        }

        const quizzes = loadQuizzes();
        const quiz = quizzes[quizId];
        if (!quiz) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
        }

        const attemptId = 'att_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const attempt = {
          attemptId,
          playerName: playerName.slice(0, 15).trim(),
          score: Number(score) || 0,
          totalQuestions: Number(totalQuestions) || 10,
          percentage: Number(percentage) || 0,
          answers: answers || [],
          timestamp: Date.now()
        };

        if (!Array.isArray(quiz.attempts)) quiz.attempts = [];
        quiz.attempts.push(attempt);
        saveQuizzes(quizzes);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, attemptId }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return true;
  }

  // 4. Creator Private Scoreboard (Requires adminKey)
  if (reqPath === '/api/games/quiz/scoreboard' && req.method === 'GET') {
    const quizId = parsedUrl.searchParams.get('id');
    const adminKey = parsedUrl.searchParams.get('key');

    if (!quizId || !adminKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing quiz id or private admin key' }));
    }

    const quizzes = loadQuizzes();
    const quiz = quizzes[quizId];
    if (!quiz) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
    }

    if (quiz.adminKey !== adminKey) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid admin key' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      quiz: {
        id: quiz.id,
        creatorName: quiz.creatorName,
        createdAt: quiz.createdAt,
        questions: quiz.questions,
        creatorAnswers: quiz.creatorAnswers,
        attempts: quiz.attempts || []
      }
    }));
  }

  // 5. Delete specific attempt from scoreboard
  if (reqPath === '/api/games/quiz/attempt' && req.method === 'DELETE') {
    const quizId = parsedUrl.searchParams.get('id');
    const adminKey = parsedUrl.searchParams.get('key');
    const attemptId = parsedUrl.searchParams.get('attemptId');

    if (!quizId || !adminKey || !attemptId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing parameters' }));
    }

    const quizzes = loadQuizzes();
    const quiz = quizzes[quizId];
    if (!quiz) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
    }

    if (quiz.adminKey !== adminKey) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    }

    quiz.attempts = (quiz.attempts || []).filter(a => a.attemptId !== attemptId);
    saveQuizzes(quizzes);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true }));
  }

  // 6. Delete entire quiz
  if (reqPath === '/api/games/quiz' && req.method === 'DELETE') {
    const quizId = parsedUrl.searchParams.get('id');
    const adminKey = parsedUrl.searchParams.get('key');

    if (!quizId || !adminKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing quiz id or admin key' }));
    }

    const quizzes = loadQuizzes();
    const quiz = quizzes[quizId];
    if (!quiz) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Quiz not found' }));
    }

    if (quiz.adminKey !== adminKey) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    }

    delete quizzes[quizId];
    saveQuizzes(quizzes);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true }));
  }

  return false;
}

// Global persistent signaling queue for WebRTC calling across multiple devices & tabs
const callSignalQueues = {}; // key: userId, value: [signals]

function handleRequest(req, res) {
  let rawUrl = req.url || '/';
  let reqPath = rawUrl.split('?')[0];

  // If Vercel rewrote /api/... to /api and passed path in req.query.all or req.query.path
  if ((reqPath === '/api' || reqPath === '/api/') && req.query) {
    const sub = req.query.path || req.query.all;
    if (sub) {
      reqPath = '/api/' + (Array.isArray(sub) ? sub.join('/') : sub);
    }
  }

  const hostHeader = req.headers.host || 'localhost:3456';
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const parsedUrl = new URL(rawUrl, `${proto}://${hostHeader}`);

  // Games API (Don't Block Me & Interactive Quizzes)
  if (reqPath.startsWith('/api/games/quiz')) {
    if (handleGamesApi(req, res, reqPath, parsedUrl)) return;
  }

  // 1. Resolve Image API endpoint (Resolves pin.it, Pinterest, Unsplash, Google URLs)
  if (reqPath === '/api/resolve-image') {
    const targetUrl = parsedUrl.searchParams.get('url');

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ success: false, error: 'Missing url parameter' }));
    }

    resolveImageUrl(targetUrl, (err, directUrl) => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      if (err || !directUrl) {
        return res.end(JSON.stringify({ success: false, error: err ? err.message : 'No image found' }));
      }
      return res.end(JSON.stringify({ success: true, imageUrl: directUrl }));
    });
    return;
  }

  // 2. Proxy Image API endpoint (Bypasses any CORS/Referrer blocks)
  if (reqPath === '/api/proxy-image') {
    const targetUrl = parsedUrl.searchParams.get('url');

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      return res.end('Missing url');
    }

    try {
      const u = new URL(targetUrl);
      const client = u.protocol === 'https:' ? https : http;
      client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': ''
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000'
        });
        proxyRes.pipe(res);
      }).on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + err.message);
      });
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid URL');
    }
    return;
  }

  // 3. WebRTC Signaling API (Dual signaling along with Supabase Realtime)
  if (reqPath === '/api/call-signal') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.method === 'POST') {
      getRequestBody(req, (err, signal) => {
        try {
          if (err || !signal) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
          }
          const target = signal.targetUserId;
          if (target) {
            if (!callSignalQueues[target]) callSignalQueues[target] = [];
            callSignalQueues[target].push({ ...signal, timestamp: Date.now() });
            callSignalQueues[target] = callSignalQueues[target].filter(s => Date.now() - s.timestamp < 60000);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.method === 'GET') {
      const userId = parsedUrl.searchParams.get('userId');
      const since = parseInt(parsedUrl.searchParams.get('since') || '0', 10);
      const signals = (callSignalQueues[userId] || []).filter(s => s.timestamp > since);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, signals }));
    }
  }

  // 4. Unknown API route response (Returns JSON 404 instead of HTML)
  if (reqPath.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ success: false, error: 'API route not found' }));
  }

  // 5. Live Reload SSE stream (Local development only)
  if (reqPath === '/live-reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('data: connected\n\n');
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // 6. Static File Serving with SPA Fallback
  let filePath = path.join(ROOT, reqPath);

  if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).slice(1);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Fallback to index.html for Single Page Application navigation
      const indexPath = path.join(ROOT, 'index.html');
      fs.readFile(indexPath, (indexErr, indexContent) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, {
            'Content-Type': MIME.html,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          });
          res.end(indexContent);
        }
      });
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    }
  });
}

const server = http.createServer(handleRequest);

// Listen only when run standalone from command line (e.g. node server.js), not when required by Vercel serverless
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`BUDDY server running at http://localhost:${PORT}`);
  });
}

module.exports = handleRequest;
