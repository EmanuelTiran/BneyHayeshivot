const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.ANALYTICS_HASH_SECRET = 'test-secret-that-is-longer-than-thirty-two-characters';
process.env.ANALYTICS_RETENTION_DAYS = '400';

const {
  AnalyticsDateRangeError,
  resolveAnalyticsDateRange,
  zonedDateTimeToUtc,
} = require('../utils/analyticsDateRange');

test('calculates Jerusalem midnight correctly during daylight saving time', () => {
  const result = zonedDateTimeToUtc({ year: 2026, month: 7, day: 21 });
  assert.equal(result.toISOString(), '2026-07-20T21:00:00.000Z');
});

test('calculates Jerusalem midnight correctly during standard time', () => {
  const result = zonedDateTimeToUtc({ year: 2026, month: 1, day: 15 });
  assert.equal(result.toISOString(), '2026-01-14T22:00:00.000Z');
});

test('resolves the today preset from Jerusalem midnight until now', () => {
  const now = new Date('2026-07-21T12:00:00.000Z');
  const range = resolveAnalyticsDateRange({ preset: 'today' }, now);

  assert.equal(range.from.toISOString(), '2026-07-20T21:00:00.000Z');
  assert.equal(range.to.toISOString(), now.toISOString());
  assert.equal(range.granularity, 'hour');
  assert.equal(range.timeZone, 'Asia/Jerusalem');
});

test('resolves a seven-day range including the current Jerusalem date', () => {
  const now = new Date('2026-07-21T12:00:00.000Z');
  const range = resolveAnalyticsDateRange({ preset: '7d' }, now);

  assert.equal(range.fromDate, '2026-07-15');
  assert.equal(range.toDate, '2026-07-21');
  assert.equal(range.dayCount, 7);
  assert.equal(range.granularity, 'day');
});

test('treats the custom end date as inclusive', () => {
  const range = resolveAnalyticsDateRange({
    preset: 'custom',
    from: '2026-01-15',
    to: '2026-01-15',
  });

  assert.equal(range.from.toISOString(), '2026-01-14T22:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-01-15T22:00:00.000Z');
  assert.equal(range.dayCount, 1);
});

test('rejects invalid and oversized custom ranges', () => {
  assert.throws(
    () =>
      resolveAnalyticsDateRange({
        preset: 'custom',
        from: '2026-02-30',
        to: '2026-03-01',
      }),
    AnalyticsDateRangeError
  );

  assert.throws(
    () =>
      resolveAnalyticsDateRange({
        preset: 'custom',
        from: '2024-01-01',
        to: '2026-01-01',
      }),
    AnalyticsDateRangeError
  );
});