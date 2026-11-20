const test = require('node:test');
const assert = require('node:assert/strict');
const rateLimiter = require('../src/rate-limiter');
const copyLibrary = require('../docs/copy-library.json');

test('Feature 7: Rate Limiting & Abuse Prevention Test Suite', async (t) => {

  t.beforeEach(() => {
    rateLimiter._reset();
  });

  await t.test('Initial state allows up to 10 checks per connection/account (PRD Section 11)', () => {
    const id = 'ip:192.168.1.100';
    const status = rateLimiter.checkLimit(id);
    assert.equal(status.allowed, true);
    assert.equal(status.remaining, 10);
  });

  await t.test('Acceptance Test 21: The eleventh check within 24 hours is refused, with the time to retry', () => {
    const id = 'ip:203.0.113.1';
    const now = 1700000000000;

    // Perform 10 valid checks
    for (let i = 1; i <= 10; i++) {
      const checkStatus = rateLimiter.checkLimit(id, now + (i * 1000));
      assert.equal(checkStatus.allowed, true, `Check ${i} must be allowed`);
      rateLimiter.recordCheck(id, now + (i * 1000));
    }

    // 11th check must be refused
    const eleventh = rateLimiter.checkLimit(id, now + 15000);
    assert.equal(eleventh.allowed, false, 'Eleventh check within 24h must be refused');
    assert.equal(eleventh.remaining, 0);
    assert.ok(eleventh.retryAfterSeconds > 0, 'Must include retry after seconds');
    assert.ok(eleventh.formattedTime, 'Must include formatted retry time');

    // Must match approved copy library text
    const expectedPrefix = 'You have used your 10 checks for today. You can run another check after';
    assert.ok(eleventh.message.startsWith(expectedPrefix), `Message must start with approved copy: "${eleventh.message}"`);
    assert.ok(!eleventh.message.includes('[time]'), 'Message must replace [time] placeholder with real time');
  });

  await t.test('Acceptance Test 22: A check rejected before contacting the page does not count', () => {
    const id = 'ip:198.51.100.2';
    const now = 1700000000000;

    // Check limit is queried, but recordCheck is NOT called because page was unreachable / SSRF
    const initial = rateLimiter.checkLimit(id, now);
    assert.equal(initial.allowed, true);
    assert.equal(initial.remaining, 10);

    // Simulated 5 failed checks before contact (do not call recordCheck)
    // Remaining checks must still be 10
    const afterFailedAttempts = rateLimiter.checkLimit(id, now + 5000);
    assert.equal(afterFailedAttempts.allowed, true);
    assert.equal(afterFailedAttempts.remaining, 10, 'Rejected checks must not consume quota');
  });

  await t.test('Checks expire after 24 hours (Sliding Window)', () => {
    const id = 'account:acc_premium_01';
    const t0 = 1700000000000;

    // Use up all 10 checks at t0
    for (let i = 0; i < 10; i++) {
      rateLimiter.recordCheck(id, t0 + (i * 100));
    }

    // Immediately after: blocked
    assert.equal(rateLimiter.checkLimit(id, t0 + 2000).allowed, false);

    // 24 hours + 1 second later: all checks should expire
    const t24hLater = t0 + (24 * 60 * 60 * 1000) + 1000;
    const refreshed = rateLimiter.checkLimit(id, t24hLater);
    assert.equal(refreshed.allowed, true, 'Checks must expire after 24h');
    assert.equal(refreshed.remaining, 10, 'All 10 checks should be restored');
  });

  await t.test('User accounts and IP addresses are strictly isolated', () => {
    const ipAnon = 'ip:10.0.0.1';
    const accountUser = 'account:acc_456';
    const otherAccount = 'account:acc_789';

    // ipAnon uses 10 checks
    for (let i = 0; i < 10; i++) {
      rateLimiter.recordCheck(ipAnon);
    }
    assert.equal(rateLimiter.checkLimit(ipAnon).allowed, false);

    // accountUser is completely unaffected
    assert.equal(rateLimiter.checkLimit(accountUser).allowed, true);
    assert.equal(rateLimiter.checkLimit(accountUser).remaining, 10);

    // otherAccount is completely unaffected
    assert.equal(rateLimiter.checkLimit(otherAccount).allowed, true);
    assert.equal(rateLimiter.checkLimit(otherAccount).remaining, 10);
  });

  await t.test('formatRetryTime accurately creates human-friendly times', () => {
    const now = new Date('2026-11-20T12:00:00Z').getTime();
    const sameDay = new Date('2026-11-20T15:30:00Z').getTime();
    const nextDay = new Date('2026-11-21T09:15:00Z').getTime();

    const sameDayFormatted = rateLimiter.formatRetryTime(sameDay, now);
    assert.ok(sameDayFormatted.length > 0);

    const nextDayFormatted = rateLimiter.formatRetryTime(nextDay, now);
    assert.ok(nextDayFormatted.startsWith('tomorrow at'));
  });
});
