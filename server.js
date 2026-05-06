#!/usr/bin/env node
// Serves static files + proxies Lulu pricing API (CORS-safe)
// Usage:  node server.js
// Credentials: set LULU_CLIENT_ID and LULU_CLIENT_SECRET in .env

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Load .env ─────────────────────────────────────────
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach(line => {
      const eq = line.indexOf('=');
      if (eq < 1) return;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k) process.env[k] = v;
    });
} catch (_) {}

const PORT               = process.env.PORT              || 8080;
const LULU_CLIENT_ID     = process.env.LULU_CLIENT_ID    || '';
const LULU_CLIENT_SECRET = process.env.LULU_CLIENT_SECRET|| '';
const LULU_HOST          = 'api.lulu.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff2': 'font/woff2',
};

// ── Lulu token cache ──────────────────────────────────
let _token       = null;
let _tokenExpiry = 0;

function httpsRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const err = new Error(`HTTP ${res.statusCode}: ${data}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        resolve(data);
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getLuluToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     LULU_CLIENT_ID,
    client_secret: LULU_CLIENT_SECRET,
  }).toString();

  const raw = await httpsRequest({
    hostname: LULU_HOST,
    path:     '/auth/realms/glasstree/protocol/openid-connect/token',
    method:   'POST',
    headers: {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  const json       = JSON.parse(raw);
  _token           = json.access_token;
  _tokenExpiry     = Date.now() + (json.expires_in - 30) * 1000;
  return _token;
}

// ── Read request body ─────────────────────────────────
function readBody(req) {
  return new Promise(resolve => {
    let s = '';
    req.on('data', c => s += c);
    req.on('end', () => resolve(s));
  });
}

// ── HTTP server ───────────────────────────────────────
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── POST /api/lulu/price ──────────────────────────
  if (req.method === 'POST' && req.url === '/api/lulu/price') {
    const body = await readBody(req);
    try {
      if (!LULU_CLIENT_ID || !LULU_CLIENT_SECRET) {
        throw new Error('LULU_CLIENT_ID / LULU_CLIENT_SECRET not set in .env');
      }
      const token  = await getLuluToken();
      const result = await httpsRequest({
        hostname: LULU_HOST,
        path:     '/print-jobs/v1/costs/',
        method:   'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(result);
    } catch (err) {
      console.error('[Lulu proxy error]', err.message);
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // ── Static file serving ───────────────────────────
  const urlPath  = req.url.split('?')[0];
  const filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const mime = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`\n  Manga site → http://localhost:${PORT}`);
  if (!LULU_CLIENT_ID) {
    console.warn('  Lulu credentials not set — price will fall back to estimate formula');
    console.warn('  Add LULU_CLIENT_ID and LULU_CLIENT_SECRET to .env to enable live quotes\n');
  } else {
    console.log('  Lulu proxy active — live price quotes enabled\n');
  }
});
