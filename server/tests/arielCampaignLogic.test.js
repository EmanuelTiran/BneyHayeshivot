'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { statsFromDonations, publicRecent, validAmount, isSafePaymentUrl } = require('../services/arielCampaignLogic');

const cfg = { initialGoal: 15000, extendedGoal: 20000 };

test('initial goal before threshold', () => {
  assert.deepEqual(statsFromDonations([
    { amount: 500, status: 'confirmed' },
    { amount: 500, status: 'confirmed' },
    { amount: 5000, status: 'pending' },
  ], cfg), { total: 1000, count: 2, goal: 15000, initialGoal: 15000, extendedGoal: 20000, goalExtended: false, remaining: 14000, progress: 6.7 });
});

test('exactly 15000 keeps original goal, above extends', () => {
  assert.equal(statsFromDonations([{ amount: 15000, status: 'confirmed' }], cfg).goal, 15000);
  const result = statsFromDonations([{ amount: 15001, status: 'confirmed' }], cfg);
  assert.equal(result.goal, 20000);
  assert.equal(result.remaining, 4999);
});

test('void and rejected donations are not counted', () => {
  assert.equal(statsFromDonations([
    { amount: 10000, status: 'void' }, { amount: 2000, status: 'rejected' },
  ], cfg).total, 0);
});

test('only opted-in names are exposed publicly', () => {
  const rows = [
    { _id: 'a', amount: 100, status: 'confirmed', donorName: 'לא לפרסם', displayName: false, createdAt: '2026-11-01' },
    { _id: 'b', amount: 180, status: 'confirmed', donorName: 'משפחת ישראלי', displayName: true, createdAt: '2026-11-02' },
    { _id: 'c', amount: 900, status: 'pending', donorName: 'ממתין', displayName: true, createdAt: '2026-11-03' },
  ];
  const recent = publicRecent(rows);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].name, 'משפחת ישראלי');
  assert.equal(recent[1].name, null);
  assert.equal(JSON.stringify(recent).includes('לא לפרסם'), false);
});

test('public donor list includes more than eight confirmed donations, newest first', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({
    _id: `donation-${i}`, amount: 100 + i, status: 'confirmed',
    donorName: `Name ${i}`, displayName: i % 2 === 0,
    confirmedAt: new Date(Date.UTC(2026, 10, i + 1)).toISOString(),
  }));
  rows.push({ _id: 'pending', amount: 9000, status: 'pending', donorName: 'Private', displayName: true });
  const publicRows = publicRecent(rows);
  assert.equal(publicRows.length, 12);
  assert.equal(publicRows[0].id, 'donation-11');
  assert.equal(publicRows.at(-1).id, 'donation-0');
  assert.equal(publicRows[0].name, null);
  assert.equal(publicRows[1].name, 'Name 10');
  assert.equal(JSON.stringify(publicRows).includes('pending'), false);
});

test('strict whole-₪ payment amount validation', () => {
  assert.equal(validAmount(100), true);
  for (const bad of [-1, 0, 12.5, '100', NaN, Infinity, 1000001]) assert.equal(validAmount(bad), false);
});

test('bit URLs must be https', () => {
  assert.equal(isSafePaymentUrl('https://example.com/pay'), true);
  assert.equal(isSafePaymentUrl('javascript:alert(1)'), false);
  assert.equal(isSafePaymentUrl('http://example.com'), false);
  for (const value of ['https://user:password@example.com', null, {}, false]) assert.equal(isSafePaymentUrl(value), false);
  assert.equal(isSafePaymentUrl(''), true);
});

test('only literal true grants public-name permission', () => {
  const rows = [false, 'false', 'true', 1, null, undefined].map((displayName, i) => ({ _id: i, amount: 1, status: 'confirmed', donorName: 'Private', displayName }));
  assert.ok(publicRecent(rows).every(row => row.name === null));
});

test('CSV exports neutralize formulas and escape cell boundaries', async () => {
  const { csvCell } = await import('../../client/src/features/ariel/arielCsv.mjs');
  for (const attack of ['=HYPERLINK("https://example.com")', '+1+1', '-1+1', '@SUM(1)', '\t=1+1', '\n=1+1', ' \u0000=1+1', '\tplain']) assert.ok(csvCell(attack).startsWith('"\''));
  assert.equal(csvCell('name, "quoted"'), '"name, ""quoted"""');
  assert.equal(csvCell(180), '"180"');
});
