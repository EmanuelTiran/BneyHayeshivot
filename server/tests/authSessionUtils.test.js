const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_AUTH_SESSION_DAYS,
  MAX_AUTH_SESSION_DAYS,
  createAuthSessionExpiry,
  createRefreshToken,
  getAuthSessionDays,
  getAuthSessionTtlMs,
  hashRefreshToken,
} = require('../utils/authSessionUtils');

const DAY_MS = 24 * 60 * 60 * 1000;

test('creates unpredictable opaque refresh tokens', () => {
  const first = createRefreshToken();
  const second = createRefreshToken();

  assert.match(first, /^[A-Za-z0-9_-]{64}$/);
  assert.match(second, /^[A-Za-z0-9_-]{64}$/);
  assert.notEqual(first, second);
});

test('hashes refresh tokens without storing the raw value', () => {
  const token = createRefreshToken();
  const firstHash = hashRefreshToken(token);
  const secondHash = hashRefreshToken(token);

  assert.match(firstHash, /^[a-f0-9]{64}$/);
  assert.equal(firstHash, secondHash);
  assert.notEqual(firstHash, token);
  assert.equal(hashRefreshToken('short'), null);
});

test('uses a safe rolling session duration', () => {
  assert.equal(
    getAuthSessionDays(),
    DEFAULT_AUTH_SESSION_DAYS
  );
  assert.equal(getAuthSessionDays('30'), 30);
  assert.equal(
    getAuthSessionDays(String(MAX_AUTH_SESSION_DAYS)),
    MAX_AUTH_SESSION_DAYS
  );
  assert.equal(
    getAuthSessionDays('0'),
    DEFAULT_AUTH_SESSION_DAYS
  );
  assert.equal(
    getAuthSessionDays('401'),
    DEFAULT_AUTH_SESSION_DAYS
  );
  assert.equal(
    getAuthSessionDays('not-a-number'),
    DEFAULT_AUTH_SESSION_DAYS
  );
  assert.equal(getAuthSessionTtlMs('30'), 30 * DAY_MS);
});

test('creates expiry from the supplied clock and duration', () => {
  const now = new Date('2026-08-02T12:00:00.000Z');
  const expiresAt = createAuthSessionExpiry(
    now,
    10 * DAY_MS
  );

  assert.equal(
    expiresAt.toISOString(),
    '2026-08-12T12:00:00.000Z'
  );
});
