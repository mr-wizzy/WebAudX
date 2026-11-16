/**
 * WebAudX Backend Runtime Server
 * Native Node.js HTTP Server (Zero external runtime dependencies)
 * Conforms to:
 * - AGENTS.md Section 2 (Server-side inspection & validation architecture)
 * - PRD Section 4 & Section 14 (Feature 1 Address Input API)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { validateAddress } = require('./src/validate-address.js');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(json),
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(json);
}

function serveStatic(req, res, filePath) {
  // Prevent directory traversal
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('Access Denied');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('File Not Found');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API: Health Check
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', service: 'WebAudX', version: '1.0.0' });
  }

  // 2. API: Copy Library
  if (req.method === 'GET' && pathname === '/api/copy-library') {
    const copyPath = path.join(ROOT_DIR, 'docs', 'copy-library.json');
    return fs.readFile(copyPath, 'utf8', (err, data) => {
      if (err) return sendJson(res, 500, { error: 'Failed to read copy library' });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(data);
    });
  }

  // 3. API: Address Validation Endpoint (Feature 1)
  if (req.method === 'POST' && pathname === '/api/validate-address') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10240) { // Limit request body to 10 KB
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Payload Too Large');
        req.destroy();
      }
    });

    return req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = validateAddress(payload.address);
        sendJson(res, 200, result);
      } catch (e) {
        sendJson(res, 400, { valid: false, error: "Invalid JSON request payload." });
      }
    });
  }

  // 4. Static Asset Routing
  if (req.method === 'GET' || req.method === 'HEAD') {
    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(ROOT_DIR, 'index.html');
    } else if (pathname === '/signup.html') {
      filePath = path.join(ROOT_DIR, 'signup.html');
    } else {
      filePath = path.join(ROOT_DIR, decodeURIComponent(pathname));
    }
    return serveStatic(req, res, filePath);
  }

  // Fallback for unsupported methods
  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`WebAudX server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;
