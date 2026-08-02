const crypto = require('crypto');

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_AUTH_SESSION_DAYS = 400;
const MAX_AUTH_SESSION_DAYS = 400;

function getAuthSessionDays(value = process.env.AUTH_SESSION_DAYS) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_AUTH_SESSION_DAYS;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_AUTH_SESSION_DAYS
  ) {
    return DEFAULT_AUTH_SESSION_DAYS;
  }

  return parsed;
}

function getAuthSessionTtlMs(value = process.env.AUTH_SESSION_DAYS) {
  return getAuthSessionDays(value) * DAY_MS;
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashRefreshToken(token) {
  if (typeof token !== 'string' || token.length < 32) {
    return null;
  }

  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function createAuthSessionExpiry(
  now = new Date(),
  ttlMs = getAuthSessionTtlMs()
) {
  return new Date(now.getTime() + ttlMs);
}

module.exports = {
  DEFAULT_AUTH_SESSION_DAYS,
  MAX_AUTH_SESSION_DAYS,
  createAuthSessionExpiry,
  createRefreshToken,
  getAuthSessionDays,
  getAuthSessionTtlMs,
  hashRefreshToken,
};
