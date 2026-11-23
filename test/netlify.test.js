const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/api.js');

test('Netlify Serverless Function Handler Test Suite', async (t) => {
  await t.test('OPTIONS preflight returns 204 with CORS headers', async () => {
    const res = await handler({
      httpMethod: 'OPTIONS',
      path: '/api/inspect',
      headers: {}
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  });

  await t.test('GET /api/health returns service status', async () => {
    const res = await handler({
      httpMethod: 'GET',
      path: '/api/health',
      headers: {}
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'WebAudX');
  });

  await t.test('GET /.netlify/functions/api/copy-library handles Netlify function path', async () => {
    const res = await handler({
      httpMethod: 'GET',
      path: '/.netlify/functions/api/copy-library',
      headers: {}
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, 'approved');
  });

  await t.test('POST /api/validate-address validates address payload', async () => {
    const res = await handler({
      httpMethod: 'POST',
      path: '/api/validate-address',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: 'thequeenva.com' })
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.valid, true);
    assert.equal(body.url, 'https://thequeenva.com/');
  });

  await t.test('POST /api/inspect rejects prohibited destinations', async () => {
    const res = await handler({
      httpMethod: 'POST',
      path: '/api/inspect',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'http://127.0.0.1' })
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, false);
    assert.equal(body.overallStatus, 'Not completed');
  });
});
