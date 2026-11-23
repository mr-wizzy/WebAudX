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
const { inspectWebpage } = require('./src/inspect-page.js');
const accountStore = require('./src/account-store.js');
const brandingValidator = require('./src/branding.js');
const rateLimiter = require('./src/rate-limiter.js');
const mailer = require('./src/mailer.js');
const embeddedAssets = require('./src/embedded-assets.js');
const copyLibrary = require('./docs/copy-library.json');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = process.cwd();
const ROOT_DIRS = [
  process.cwd(),
  path.resolve(__dirname)
];

function resolveStaticPath(pathname) {
  const clean = decodeURIComponent(pathname.replace(/^\//, ''));
  for (const root of ROOT_DIRS) {
    const candidate = path.join(root, clean);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(ROOT_DIR, clean);
}

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
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(json);
}

function serveStatic(req, res, filePath) {
  // Prevent directory traversal and block private data directories
  const safePath = path.normalize(filePath);
  const isInsideRoot = ROOT_DIRS.some(root => {
    const rel = path.relative(root, safePath);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  });
  const relPath = path.relative(ROOT_DIR, safePath);
  if (
    !isInsideRoot ||
    relPath.startsWith('data') ||
    relPath.startsWith('.agent') ||
    relPath.startsWith('.git') ||
    safePath.includes('accounts.json')
  ) {
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
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
}

function getSessionToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([a-f0-9]{64})/i);
    if (match) return match[1];
  }
  return null;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // 1. API: Health Check
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', service: 'WebAudX', version: '1.0.0' });
  }

  // 2. API: Copy Library
  if (req.method === 'GET' && pathname === '/api/copy-library') {
    return sendJson(res, 200, copyLibrary);
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

  // 4. API: Webpage Inspection Endpoint (Feature 2 & Feature 7 Rate Limiting)
  if (req.method === 'POST' && pathname === '/api/inspect') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10240) { // Limit request body to 10 KB
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Payload Too Large');
        req.destroy();
      }
    });

    return req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const targetUrl = payload.url || payload.address;

        // Rate limiting check (PRD Section 11 & Acceptance Test 21, 22)
        const sessionToken = getSessionToken(req);
        const account = sessionToken ? accountStore.getAccountBySession(sessionToken) : null;
        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        let clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
        if (clientIp.startsWith('::ffff:')) {
          clientIp = clientIp.substring(7);
        }
        const identifier = account ? (`account:${account.id}`) : (`ip:${clientIp}`);

        const limitStatus = rateLimiter.checkLimit(identifier);
        if (!limitStatus.allowed) {
          res.setHeader('Retry-After', String(limitStatus.retryAfterSeconds));
          return sendJson(res, 429, {
            success: false,
            error: limitStatus.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfterSeconds: limitStatus.retryAfterSeconds,
            formattedTime: limitStatus.formattedTime,
            overallStatus: 'Not completed'
          });
        }

        console.log(`[Inspection API] Starting inspection for: ${targetUrl} [${identifier}]`);
        const sampleLinks = payload.sampleLinks !== false;
        const result = await inspectWebpage(targetUrl, sampleLinks);
        console.log(`[Inspection API] Completed: ${targetUrl} (Status: ${result.overallStatus}, Success: ${result.success})`);

        // Acceptance Test 22: A check counts once WebAudX has contacted the page.
        // Rejected addresses and unreachable pages do not count.
        if (result.success || result.overallStatus === 'Complete' || result.overallStatus === 'Limited') {
          rateLimiter.recordCheck(identifier);
        }

        sendJson(res, 200, result);
      } catch (e) {
        console.error(`[Inspection API Error]`, e);
        sendJson(res, 500, { success: false, error: e.message || 'Inspection failed' });
      }
    });
  }

  // 4b. API: Query Rate Limit (Feature 7)
  if (req.method === 'GET' && pathname === '/api/rate-limit') {
    const sessionToken = getSessionToken(req);
    const account = sessionToken ? accountStore.getAccountBySession(sessionToken) : null;
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    let clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }
    const identifier = account ? (`account:${account.id}`) : (`ip:${clientIp}`);

    const status = rateLimiter.checkLimit(identifier);
    return sendJson(res, 200, status);
  }

  // 5. API: Request Magic Link (Feature 6 & Acceptance Test 3)
  if (req.method === 'POST' && pathname === '/api/auth/magic-link') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10240) { req.destroy(); }
    });
    return req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const link = accountStore.createMagicLink(payload.email);
        const host = req.headers.host || 'localhost:3000';
        const dynamicDevLink = `http://${host}/signup.html?token=${link.token}`;
        console.log(`[Auth API] Magic link generated for ${link.email}: ${dynamicDevLink}`);

        // Dispatch real email via SMTP if configured
        const mailResult = await mailer.sendMagicLinkEmail({
          to: link.email,
          magicLink: dynamicDevLink
        });

        sendJson(res, 200, {
          success: true,
          message: 'Sign-in link sent.',
          emailSent: mailResult.sent,
          token: link.token,
          devLink: dynamicDevLink
        });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
  }

  // 6. API: Verify Magic Link (Feature 6 & Acceptance Test 3)
  if (req.method === 'POST' && pathname === '/api/auth/verify') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10240) { req.destroy(); }
    });
    return req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const authResult = accountStore.verifyMagicLink(payload.token);
        res.setHeader('Set-Cookie', `session_token=${authResult.sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
        sendJson(res, 200, {
          success: true,
          sessionToken: authResult.sessionToken,
          accountId: authResult.accountId,
          email: authResult.email,
          branding: authResult.branding
        });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
  }

  // 7. API: Get Account Branding (Feature 6 & Acceptance Test 24 Data Isolation)
  if (req.method === 'GET' && pathname === '/api/account/branding') {
    const sessionToken = getSessionToken(req);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(res, 401, { success: false, error: 'Please sign in to view your branding.' });
    }
    return sendJson(res, 200, {
      success: true,
      accountId: account.id,
      email: account.email,
      branding: account.branding
    });
  }

  // 8. API: Update Account Branding (Feature 6 & Acceptance Test 4, 23)
  if (req.method === 'POST' && pathname === '/api/account/branding') {
    const sessionToken = getSessionToken(req);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(res, 401, { success: false, error: 'Please sign in to update your branding.' });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5242880) { // 5 MB limit to accommodate 1 MB base64 logo and branding data
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('Payload Too Large');
        req.destroy();
      }
    });

    return req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const updatedBranding = accountStore.updateAccountBranding(account.id, payload);
        sendJson(res, 200, {
          success: true,
          branding: updatedBranding
        });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
  }

  // 9. API: Delete Account & Data (Feature 6 & Acceptance Test 25 Deletion within 30 days)
  if (req.method === 'DELETE' && pathname === '/api/account') {
    const sessionToken = getSessionToken(req);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(res, 401, { success: false, error: 'Please sign in to delete your account.' });
    }

    accountStore.deleteAccount(account.id);
    res.setHeader('Set-Cookie', 'session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return sendJson(res, 200, {
      success: true,
      message: 'Account and branding data permanently deleted.'
    });
  }

  // 10. API: Logout
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const sessionToken = getSessionToken(req);
    accountStore.invalidateSession(sessionToken);
    res.setHeader('Set-Cookie', 'session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return sendJson(res, 200, { success: true });
  }

  // 4. Static Asset Routing
  if (req.method === 'GET' || req.method === 'HEAD') {
    const cleanPath = pathname.replace(/^\//, '');
    if (embeddedAssets[cleanPath]) {
      const asset = embeddedAssets[cleanPath];
      res.writeHead(200, {
        'Content-Type': asset.contentType,
        'Content-Length': asset.buffer.length,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=86400'
      });
      return res.end(asset.buffer);
    }

    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = resolveStaticPath('index.html');
    } else if (pathname === '/signup.html') {
      filePath = resolveStaticPath('signup.html');
    } else {
      filePath = resolveStaticPath(pathname);
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
