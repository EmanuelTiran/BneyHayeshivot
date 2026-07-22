const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.ANALYTICS_HASH_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';

const {
  AnalyticsValidationError,
  classifySource,
  hashIdentifier,
  isLikelyBot,
  isValidUuid,
  parseUserAgent,
  sanitizeActiveMs,
  sanitizePath,
} = require('../utils/analyticsUtils');

const UUID = '123e4567-e89b-42d3-a456-426614174000';

test('accepts a valid UUID v4 and rejects invalid identifiers', () => {
  assert.equal(isValidUuid(UUID), true);
  assert.equal(isValidUuid('not-a-uuid'), false);
});

test('hashes identifiers consistently without storing the raw value', () => {
  const first = hashIdentifier('visitor', UUID);
  const second = hashIdentifier('visitor', UUID);

  assert.equal(first, second);
  assert.equal(first.length, 64);
  assert.notEqual(first, UUID);
  assert.notEqual(first, hashIdentifier('session', UUID));
});

test('removes query strings and hashes from paths', () => {
  assert.equal(sanitizePath('/contact?email=test@example.com#form'), '/contact');
  assert.equal(sanitizePath('/'), '/');
});

test('rejects paths that do not begin with a slash', () => {
  assert.throws(
    () => sanitizePath('contact'),
    (error) => error instanceof AnalyticsValidationError
  );
});

test('classifies traffic sources', () => {
  assert.equal(
    classifySource({
      referrerHost: 'www.google.com',
      utmSource: '',
      siteHost: 'https://example.com',
    }),
    'google'
  );

  assert.equal(
    classifySource({
      referrerHost: 'www.instagram.com',
      utmSource: '',
      siteHost: 'https://example.com',
    }),
    'social'
  );

  assert.equal(
    classifySource({
      referrerHost: '',
      utmSource: '',
      siteHost: 'https://example.com',
    }),
    'direct'
  );

  assert.equal(
    classifySource({
      referrerHost: 'example.com',
      utmSource: '',
      siteHost: 'https://example.com',
    }),
    'internal'
  );
});

test('detects common bots', () => {
  assert.equal(isLikelyBot('Googlebot/2.1'), true);
  assert.equal(
    isLikelyBot(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36'
    ),
    false
  );
});

test('classifies device, browser and operating system', () => {
  assert.deepEqual(
    parseUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36'
    ),
    { deviceType: 'mobile', browser: 'Chrome', os: 'Android' }
  );

  assert.deepEqual(
    parseUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/125.0'
    ),
    { deviceType: 'desktop', browser: 'Edge', os: 'Windows' }
  );
});

test('clamps heartbeat active time', () => {
  assert.equal(sanitizeActiveMs(1200.6), 1201);
  assert.equal(sanitizeActiveMs(999999), 45000);
  assert.throws(() => sanitizeActiveMs(-1), AnalyticsValidationError);
});