/**
 * WebAudX Rate Limiter & Abuse Prevention Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 11 (Limits and Data)
 * - Acceptance Test 21: The eleventh check within 24 hours is refused, with the time to retry.
 * - Acceptance Test 22: A check rejected before contacting the page does not count.
 * - Approved copy from docs/copy-library.json: "You have used your 10 checks for today. You can run another check after [time]."
 */

const fs = require('fs');
const path = require('path');
const copyLibrary = require('../docs/copy-library.json');

const MAX_CHECKS_PER_24H = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in ms
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const RATE_LIMITS_FILE = path.join(DATA_DIR, 'rate-limits.json');

// In-memory cache synced to disk
let memoryStore = {};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore() {
  try {
    if (fs.existsSync(RATE_LIMITS_FILE)) {
      const raw = fs.readFileSync(RATE_LIMITS_FILE, 'utf8');
      memoryStore = JSON.parse(raw);
    } else {
      memoryStore = {};
    }
  } catch (e) {
    memoryStore = {};
  }
}

function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(RATE_LIMITS_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    // If disk write fails, in-memory cache still protects the runtime
  }
}

// Initial load
loadStore();

/**
 * Prunes timestamps older than 24 hours.
 * @param {Array<number>} timestamps
 * @param {number} now
 * @returns {Array<number>}
 */
function pruneTimestamps(timestamps, now) {
  const threshold = now - WINDOW_MS;
  return (timestamps || []).filter(ts => ts > threshold);
}

/**
 * Formats a retry time for user display matching approved plain-English style.
 * e.g., "3:45 PM" or "tomorrow at 10:15 AM"
 *
 * @param {number} resetTime
 * @param {number} now
 * @returns {string}
 */
function formatRetryTime(resetTime, now = Date.now()) {
  const resetDate = new Date(resetTime);
  const nowDate = new Date(now);

  const timeString = resetDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const isSameDay = resetDate.getDate() === nowDate.getDate() &&
    resetDate.getMonth() === nowDate.getMonth() &&
    resetDate.getFullYear() === nowDate.getFullYear();

  if (isSameDay) {
    return timeString;
  }
  return `tomorrow at ${timeString}`;
}

/**
 * Checks whether an identifier (IP connection or Account ID) is allowed to run a check.
 *
 * @param {string} identifier - e.g. "ip:192.168.1.1" or "account:acc_xyz"
 * @param {number} [now]
 * @returns {{ allowed: boolean, remaining: number, resetTime?: number, retryAfterSeconds?: number, formattedTime?: string, message?: string }}
 */
function checkLimit(identifier, now = Date.now()) {
  if (!identifier) {
    identifier = 'ip:anonymous';
  }

  const existing = memoryStore[identifier] || [];
  const valid = pruneTimestamps(existing, now);
  memoryStore[identifier] = valid;

  if (valid.length >= MAX_CHECKS_PER_24H) {
    // Earliest check will expire at valid[0] + WINDOW_MS
    const earliest = Math.min(...valid);
    const resetTime = earliest + WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
    const formattedTime = formatRetryTime(resetTime, now);

    const baseCopy = (copyLibrary && copyLibrary.limits_and_system && copyLibrary.limits_and_system.daily_limit_reached)
      ? copyLibrary.limits_and_system.daily_limit_reached
      : 'You have used your 10 checks for today. You can run another check after [time].';

    const message = baseCopy.replace('[time]', formattedTime);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfterSeconds,
      formattedTime,
      message
    };
  }

  return {
    allowed: true,
    remaining: MAX_CHECKS_PER_24H - valid.length
  };
}

/**
 * Records a completed check that contacted the target webpage.
 * Conforms to:
 * - A check counts once WebAudX has contacted the page (PRD Section 11).
 * - Rejected addresses and unreachable pages do not count.
 *
 * @param {string} identifier
 * @param {number} [timestamp]
 * @returns {{ totalUsed: number, remaining: number }}
 */
function recordCheck(identifier, timestamp = Date.now()) {
  if (!identifier) {
    identifier = 'ip:anonymous';
  }

  const existing = memoryStore[identifier] || [];
  const valid = pruneTimestamps(existing, timestamp);
  valid.push(timestamp);
  memoryStore[identifier] = valid;
  saveStore();

  return {
    totalUsed: valid.length,
    remaining: Math.max(0, MAX_CHECKS_PER_24H - valid.length)
  };
}

/**
 * Gets remaining checks for an identifier.
 * @param {string} identifier
 * @param {number} [now]
 * @returns {number}
 */
function getRemaining(identifier, now = Date.now()) {
  const status = checkLimit(identifier, now);
  return status.remaining;
}

/**
 * Reset memory and stored limits (for unit tests).
 */
function _reset() {
  memoryStore = {};
  try {
    if (fs.existsSync(RATE_LIMITS_FILE)) {
      fs.unlinkSync(RATE_LIMITS_FILE);
    }
  } catch (e) {
    // Ignore error
  }
}

module.exports = {
  MAX_CHECKS_PER_24H,
  WINDOW_MS,
  checkLimit,
  recordCheck,
  getRemaining,
  formatRetryTime,
  _reset
};
