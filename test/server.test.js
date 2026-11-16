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
});
