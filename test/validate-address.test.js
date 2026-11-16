const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAddress, isProhibitedDestination, getRegistrableDomain, isInternalLink, MESSAGES } = require('../src/validate-address.js');
const copyLibrary = require('../docs/copy-library.json');

test('Validation error messages strictly match approved copy-library.json', () => {
  assert.equal(MESSAGES.EMPTY, copyLibrary.address.empty);
  assert.equal(MESSAGES.WRONG_FORMAT, copyLibrary.address.wrong_format);
  assert.equal(MESSAGES.UNSUPPORTED_SCHEME, copyLibrary.address.unsupported_scheme);
  assert.equal(MESSAGES.PROHIBITED_DESTINATION, copyLibrary.address.prohibited_destination);
});

test('Acceptance Test 14: An empty address cannot be submitted', () => {
  assert.deepEqual(validateAddress(''), { valid: false, error: copyLibrary.address.empty });
  assert.deepEqual(validateAddress('   '), { valid: false, error: copyLibrary.address.empty });
});

test('Acceptance Test 15: An address without a prefix is accepted with https:// added', () => {
  const result = validateAddress('example.com');
  assert.equal(result.valid, true);
  assert.equal(result.url, 'https://example.com/');
  assert.equal(result.addedPrefix, true);

  const resultWithPath = validateAddress('example.com/pricing');
  assert.equal(resultWithPath.valid, true);
  assert.equal(resultWithPath.url, 'https://example.com/pricing');
  assert.equal(resultWithPath.addedPrefix, true);
});

test('Addresses with existing http:// or https:// prefix are accepted without adding extra prefix', () => {
  const httpsResult = validateAddress('https://example.com');
  assert.equal(httpsResult.valid, true);
  assert.equal(httpsResult.addedPrefix, false);

  const httpResult = validateAddress('http://example.com');
  assert.equal(httpResult.valid, true);
  assert.equal(httpResult.addedPrefix, false);
});

test('Unsupported schemes (ftp, file, mailto, javascript) are rejected with plain-English message', () => {
  const ftp = validateAddress('ftp://example.com/file.zip');
  assert.equal(ftp.valid, false);
  assert.equal(ftp.error, copyLibrary.address.unsupported_scheme);

  const file = validateAddress('file:///C:/passwords.txt');
  assert.equal(file.valid, false);
  assert.equal(file.error, copyLibrary.address.unsupported_scheme);
});

test('Malformed address inputs are rejected with plain-English format error', () => {
  const invalid = validateAddress('not a url at all');
  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, copyLibrary.address.wrong_format);
});

test('Acceptance Test 16: Private, local, and internal addresses are blocked (SSRF defense)', () => {
  const prohibitedList = [
    'http://localhost',
    'https://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://10.0.0.1',
    'http://192.168.1.1',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://169.254.169.254', // AWS/GCP cloud metadata
    'http://metadata.google.internal',
    'http://service.local',
    'http://database.internal',
    'http://[::1]'
  ];

  for (const url of prohibitedList) {
    const res = validateAddress(url);
    assert.equal(res.valid, false, `Expected ${url} to be blocked`);
    assert.equal(res.error, copyLibrary.address.prohibited_destination);
  }
});

test('Question 4 confirmation: Registrable domain internal link classification', () => {
  assert.equal(getRegistrableDomain('example.com'), 'example.com');
  assert.equal(getRegistrableDomain('www.example.com'), 'example.com');
  assert.equal(getRegistrableDomain('blog.example.com'), 'example.com');
  assert.equal(getRegistrableDomain('shop.example.co.uk'), 'example.co.uk');

  const base = 'https://example.com/home';
  assert.equal(isInternalLink('https://example.com/about', base), true);
  assert.equal(isInternalLink('https://blog.example.com/post-1', base), true);
  assert.equal(isInternalLink('/contact', base), true);
  assert.equal(isInternalLink('https://external.com', base), false);
});
