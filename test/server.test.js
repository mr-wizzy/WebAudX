const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const server = require('../server.js');

const TEST_PORT = 3199;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('Server API Integration Tests', async (t) => {
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  t.after(() => {
    server.close();
  });

  await t.test('GET /api/health returns service status', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, 'ok');
    assert.equal(json.service, 'WebAudX');
  });

  await t.test('GET /api/copy-library returns approved copy library', async () => {
    const res = await request('GET', '/api/copy-library');
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, 'approved');
    assert.ok(json.address.empty);
  });

  await t.test('POST /api/validate-address validates address via backend', async () => {
    const validRes = await request('POST', '/api/validate-address', JSON.stringify({ address: 'example.com' }));
    assert.equal(validRes.statusCode, 200);
    const validJson = JSON.parse(validRes.body);
    assert.equal(validJson.valid, true);
    assert.equal(validJson.addedPrefix, true);
    assert.equal(validJson.url, 'https://example.com/');

    const blockedRes = await request('POST', '/api/validate-address', JSON.stringify({ address: 'http://127.0.0.1' }));
    assert.equal(blockedRes.statusCode, 200);
    const blockedJson = JSON.parse(blockedRes.body);
    assert.equal(blockedJson.valid, false);
    assert.equal(blockedJson.error, 'This address cannot be reviewed.');
  });

  await t.test('POST /api/inspect rejects prohibited and invalid destinations', async () => {
    // Prohibited SSRF address
    const blockedRes = await request('POST', '/api/inspect', JSON.stringify({ url: 'http://127.0.0.1' }));
    assert.equal(blockedRes.statusCode, 200);
    const blockedJson = JSON.parse(blockedRes.body);
    assert.equal(blockedJson.success, false);
    assert.equal(blockedJson.overallStatus, 'Not completed');
    assert.equal(blockedJson.error, 'This address cannot be reviewed.');

    // Empty address
    const emptyRes = await request('POST', '/api/inspect', JSON.stringify({ url: '' }));
    assert.equal(emptyRes.statusCode, 200);
    const emptyJson = JSON.parse(emptyRes.body);
    assert.equal(emptyJson.success, false);
    assert.equal(emptyJson.overallStatus, 'Not completed');
    assert.equal(emptyJson.error, 'Please enter the address of the page you want to review.');

    // Malformed address
    const malformedRes = await request('POST', '/api/inspect', JSON.stringify({ url: 'not-a-valid-domain' }));
    assert.equal(malformedRes.statusCode, 200);
    const malformedJson = JSON.parse(malformedRes.body);
    assert.equal(malformedJson.success, false);
    assert.equal(malformedJson.overallStatus, 'Not completed');
  });

  await t.test('GET / serves index.html', async () => {
    const res = await request('GET', '/');
    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.body.includes('WebAudX'));
  });

  await t.test('Security: Direct file access to /data/ and private dirs returns 403 Forbidden', async () => {
    const res = await request('GET', '/data/accounts.json');
    assert.equal(res.statusCode, 403, 'Must return 403 Forbidden for /data/ files');
    assert.equal(res.body, 'Access Denied');
  });

  await t.test('Auth & Branding Endpoints Integration Flow', async () => {
    // 1. Request magic link
    const linkRes = await request('POST', '/api/auth/magic-link', JSON.stringify({ email: 'http-test@agency.com' }));
    assert.equal(linkRes.statusCode, 200);
    const linkJson = JSON.parse(linkRes.body);
    assert.equal(linkJson.success, true);
    assert.ok(linkJson.devLink.includes('token='));

    // Extract token
    const token = new URL(linkJson.devLink).searchParams.get('token');

    // 2. Verify magic link
    const verifyRes = await request('POST', '/api/auth/verify', JSON.stringify({ token }));
    assert.equal(verifyRes.statusCode, 200);
    const verifyJson = JSON.parse(verifyRes.body);
    assert.equal(verifyJson.success, true);
    const sessionToken = verifyJson.sessionToken;

    // 3. Update branding via session
    const updateRes = await new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        agencyName: 'HTTP Test Agency',
        brandColor: '#5a0484',
        font: 'Montserrat'
      });
      const req = http.request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/account/branding',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Authorization': `Bearer ${sessionToken}`
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.body.branding.agencyName, 'HTTP Test Agency');

    // 4. Retrieve branding
    const getRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/account/branding',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });

    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.body.branding.agencyName, 'HTTP Test Agency');

    // 5. Delete account
    const deleteRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/account',
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });

    assert.equal(deleteRes.statusCode, 200);
    assert.equal(deleteRes.body.success, true);
  });

  await t.test('Rate limiting endpoint and enforcement via HTTP (Feature 7)', async () => {
    const rateLimiter = require('../src/rate-limiter.js');
    rateLimiter._reset();

    // 1. Query rate limit
    const res = await request('GET', '/api/rate-limit');
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.allowed, true);
    assert.equal(json.remaining, 10);

    // 2. Consume 10 checks for test IP
    const testIp = '127.0.0.1';
    for (let i = 0; i < 10; i++) {
      rateLimiter.recordCheck(`ip:${testIp}`);
    }

    // 3. 11th inspect call must return 429 Too Many Requests
    const inspectRes = await request('POST', '/api/inspect', JSON.stringify({ url: 'https://example.com' }));
    assert.equal(inspectRes.statusCode, 429);
    assert.ok(inspectRes.headers['retry-after']);
    const inspectJson = JSON.parse(inspectRes.body);
    assert.equal(inspectJson.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(inspectJson.error.includes('You have used your 10 checks for today.'));

    // Reset so other tests aren't affected
    rateLimiter._reset();
  });
});
