/**
 * WebAudX Netlify Serverless Function Handler
 * Native Node.js (Zero external dependencies)
 */

const { validateAddress } = require('../../src/validate-address.js');
const { inspectWebpage } = require('../../src/inspect-page.js');
const accountStore = require('../../src/account-store.js');
const brandingValidator = require('../../src/branding.js');
const rateLimiter = require('../../src/rate-limiter.js');
const mailer = require('../../src/mailer.js');
const copyLibrary = require('../../docs/copy-library.json');

function sendJson(statusCode, data, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders
    },
    body: JSON.stringify(data)
  };
}

function getSessionToken(event) {
  const headers = event.headers || {};
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = headers['cookie'] || headers['Cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([a-f0-9]{64})/i);
    if (match) return match[1];
  }
  return null;
}

exports.handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // Normalize path: Netlify rewrites /api/* to /.netlify/functions/api/*
  let pathname = event.path || '';
  if (pathname.includes('/.netlify/functions/api')) {
    pathname = pathname.replace('/.netlify/functions/api', '/api');
  }
  if (!pathname.startsWith('/api')) {
    pathname = '/api' + (pathname.startsWith('/') ? pathname : '/' + pathname);
  }

  const method = event.httpMethod;

  // 1. Health check
  if (method === 'GET' && pathname === '/api/health') {
    return sendJson(200, { status: 'ok', service: 'WebAudX', version: '1.0.0' });
  }

  // 2. Copy library
  if (method === 'GET' && pathname === '/api/copy-library') {
    return sendJson(200, copyLibrary);
  }

  // Parse body for POST/DELETE requests
  let payload = {};
  if (event.body) {
    try {
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      payload = JSON.parse(rawBody || '{}');
    } catch {
      return sendJson(400, { valid: false, error: 'Invalid JSON request payload.' });
    }
  }

  // 3. Address validation
  if (method === 'POST' && pathname === '/api/validate-address') {
    const result = validateAddress(payload.address);
    return sendJson(200, result);
  }

  // 4. Webpage inspection
  if (method === 'POST' && pathname === '/api/inspect') {
    const targetUrl = payload.url || payload.address;

    // Rate limiting
    const sessionToken = getSessionToken(event);
    const account = sessionToken ? accountStore.getAccountBySession(sessionToken) : null;
    const headers = event.headers || {};
    const clientIp = (headers['x-forwarded-for'] || headers['client-ip'] || '127.0.0.1').split(',')[0].trim();
    const identifier = account ? (`account:${account.id}`) : (`ip:${clientIp}`);

    const limitStatus = rateLimiter.checkLimit(identifier);
    if (!limitStatus.allowed) {
      return sendJson(429, {
        success: false,
        error: limitStatus.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: limitStatus.retryAfterSeconds,
        formattedTime: limitStatus.formattedTime,
        overallStatus: 'Not completed'
      }, { 'Retry-After': String(limitStatus.retryAfterSeconds) });
    }

    const sampleLinks = payload.sampleLinks !== false;
    const result = await inspectWebpage(targetUrl, sampleLinks);

    if (result.success || result.overallStatus === 'Complete' || result.overallStatus === 'Limited') {
      rateLimiter.recordCheck(identifier);
    }

    return sendJson(200, result);
  }

  // 5. Auth: Request Magic Link
  if (method === 'POST' && pathname === '/api/auth/magic-link') {
    const email = payload.email;
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return sendJson(400, { success: false, error: 'Please enter a valid email address.' });
    }

    const headers = event.headers || {};
    const host = headers['host'] || 'localhost';
    const protocol = (headers['x-forwarded-proto'] || 'https');
    const baseUrl = `${protocol}://${host}`;

    const linkData = accountStore.createMagicLink(email.trim(), baseUrl);
    await mailer.sendMagicLinkEmail(email.trim(), linkData.url);

    return sendJson(200, {
      success: true,
      message: 'If this email is eligible, a magic sign-in link has been sent.',
      debugMagicLink: process.env.NODE_ENV !== 'production' ? linkData.url : undefined
    });
  }

  // 6. Auth: Verify Magic Link
  if (method === 'POST' && pathname === '/api/auth/verify-magic-link') {
    const token = payload.token;
    if (!token) {
      return sendJson(400, { success: false, error: 'Magic link token is required.' });
    }
    const session = accountStore.verifyMagicLink(token);
    if (!session) {
      return sendJson(401, { success: false, error: 'This sign-in link has expired or has already been used. Please request a new one.' });
    }
    return sendJson(200, {
      success: true,
      sessionToken: session.sessionToken,
      account: session.account
    }, {
      'Set-Cookie': `session_token=${session.sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`
    });
  }

  // 7. Get Branding
  if (method === 'GET' && pathname === '/api/account/branding') {
    const sessionToken = getSessionToken(event);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(401, { success: false, error: 'Authentication required.' });
    }
    return sendJson(200, { success: true, branding: account.branding });
  }

  // 8. Update Branding
  if (method === 'POST' && pathname === '/api/account/branding') {
    const sessionToken = getSessionToken(event);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(401, { success: false, error: 'Authentication required.' });
    }

    const validation = brandingValidator.validateBranding(payload);
    if (!validation.valid) {
      return sendJson(400, { success: false, errors: validation.errors });
    }

    const updatedAccount = accountStore.updateBranding(account.id, validation.branding);
    return sendJson(200, { success: true, branding: updatedAccount.branding });
  }

  // 9. Delete Account
  if (method === 'DELETE' && pathname === '/api/account') {
    const sessionToken = getSessionToken(event);
    const account = accountStore.getAccountBySession(sessionToken);
    if (!account) {
      return sendJson(401, { success: false, error: 'Please sign in to delete your account.' });
    }
    accountStore.deleteAccount(account.id);
    return sendJson(200, {
      success: true,
      message: 'Account and branding data permanently deleted.'
    }, {
      'Set-Cookie': 'session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
    });
  }

  // 10. Logout
  if (method === 'POST' && pathname === '/api/auth/logout') {
    const sessionToken = getSessionToken(event);
    accountStore.invalidateSession(sessionToken);
    return sendJson(200, { success: true }, {
      'Set-Cookie': 'session_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
    });
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    body: 'API Route Not Found'
  };
};
