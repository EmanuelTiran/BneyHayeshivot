'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Campaign = require('../models/ArielCampaign');
const Donation = require('../models/ArielDonation');
const Audit = require('../models/ArielAuditEvent');
const User = require('../models/User');

let database, server, base, adminToken, memberToken, inactiveToken;
let requestId = 0;
before(async () => {
  // Never use .env or a live database for these tests.
  process.env.JWT_SECRET = 'ariel-local-integration-test-only';
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(database.getUri(), { dbName: 'ariel_test' });
  await Promise.all([Campaign.init(), Donation.init(), Audit.init(), User.init()]);
  const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
  // Isolated fixtures use the real existing User collection/authorization middleware.
  await User.collection.insertMany(ids.map((id, i) => ({ _id: id, email: `fixture-${i}@example.invalid`, role: i === 1 ? 'user' : 'admin', isActive: i !== 2 })));
  [adminToken, memberToken, inactiveToken] = ids.map(userId => jwt.sign({ userId: String(userId), role: 'admin' }, process.env.JWT_SECRET));
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/ariel', require('../routes/arielCampaign'));
  app.use((_err, _req, res, _next) => res.status(500).json({ message: 'test write failed' }));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/ariel`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});
async function request(path = '', method = 'GET', body, token, ip) {
  const headers = { 'Content-Type': 'application/json', 'X-Forwarded-For': ip || `10.0.${Math.floor(++requestId / 250)}.${requestId % 250 + 1}` };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const content = await response.text();
  let data; try { data = JSON.parse(content); } catch { data = content; }
  return { status: response.status, data, headers: response.headers };
}
const manual = overrides => ({ amount: 500, method: 'other', paymentConfirmed: true, reportKey: `manual-${randomUUID()}`, ...overrides });
async function settings(patch) {
  const current = (await request('/admin', 'GET', undefined, adminToken)).data.campaign;
  return request('/admin/settings', 'PATCH', { expectedVersion: current.__v ?? 0, ...patch }, adminToken);
}

test('campaign API security, privacy and financial integrity', async t => {
  await t.test('all administrator endpoints require authentication and database-backed active admin role', async () => {
    const id = String(new mongoose.Types.ObjectId());
    for (const [path, method] of [['/admin', 'GET'], ['/admin/settings', 'PATCH'], ['/admin/donations', 'POST'], [`/admin/donations/${id}`, 'PATCH'], [`/admin/donations/${id}/status`, 'PATCH']]) {
      assert.equal((await request(path, method, method === 'GET' ? undefined : {})).status, 401);
      assert.equal((await request(path, method, method === 'GET' ? undefined : {}, memberToken)).status, 403);
      assert.equal((await request(path, method, method === 'GET' ? undefined : {}, inactiveToken)).status, 401);
      assert.equal((await request(path, method, method === 'GET' ? undefined : {}, 'invalid')).status, 401);
    }
    assert.equal((await request('/admin', 'GET', undefined, adminToken)).status, 200);
  });
  await t.test('unpublished by default, public reads cause no writes, no donation seed', async () => {
    for (const [path, method, body] of [['', 'GET'], ['/bank-details', 'GET'], ['/reports', 'POST', {}]]) assert.equal((await request(path, method, body)).status, 404);
    assert.equal(await Campaign.countDocuments(), 0);
    assert.equal(await Donation.countDocuments(), 0);
    const data = (await request('/admin', 'GET', undefined, adminToken)).data;
    assert.equal(data.campaign.published, false);
    assert.equal(data.campaign.showBeneficiaryName, false);
    assert.equal(data.campaign.showPersonalStory, false);
    assert.equal(data.stats.total, 0);
  });
  await t.test('strict settings validation, publication prerequisites and separate identity/story opt-ins', async () => {
    for (const patch of [{ bitLink: 'javascript:alert(1)' }, { bitLink: 'http://example.com' }, { bitLink: 'https://user:pass@example.com' }, { published: 'false' }, { showBeneficiaryName: 'true' }, { deadlineAt: [] }, { deadlineAt: '2026-11-17T10:00' }]) assert.equal((await settings(patch)).status, 400);
    assert.equal((await settings({ published: true })).status, 400);
    assert.equal((await settings({ beneficiaryName: 'PRIVATE BENEFICIARY', storyShort: 'PRIVATE SHORT', storyFull: 'PRIVATE STORY' })).status, 200);
    assert.equal((await request('')).status, 404);
    const published = await settings({ published: true, organizerName: 'Test organizer', extendedPurpose: 'Test expansion purpose', privacyNotice: 'Test retention and deletion contact', bitLink: 'https://example.com/pay', bankName: 'Test bank', bankAccount: '123456' });
    assert.equal(published.status, 200);
    const result = await request('');
    assert.equal(result.data.beneficiaryName, null);
    assert.equal(result.data.storyFull, '');
    assert.ok(!JSON.stringify(result.data).includes('PRIVATE'));
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.match(result.headers.get('x-robots-tag'), /noindex/);
    assert.equal((await request('/bank-details')).data.account, '123456');
  });
  await t.test('public reports stay pending, retries deduplicate and input cannot override protected fields', async () => {
    const body = { amount: 180, method: 'bit', donorName: 'PRIVATE DONOR', donorContact: 'PRIVATE CONTACT', reference: 'PRIVATE REF', displayName: false, reportKey: randomUUID(), status: 'confirmed', source: 'manual', confirmedBy: new mongoose.Types.ObjectId() };
    for (let i = 0; i < 2; i++) {
      const response = await request('/reports', 'POST', body);
      assert.equal(response.status, 202);
      assert.ok(!JSON.stringify(response.data).includes('PRIVATE'));
    }
    assert.equal(await Donation.countDocuments(), 1);
    assert.equal((await Donation.findOne()).status, 'pending');
    assert.equal((await request('')).data.stats.total, 0);
    for (const patch of [{ amount: -1 }, { amount: 1.5 }, { amount: '100' }, { amount: 1000001 }, { method: 'other' }, { reportKey: `manual-${randomUUID()}` }, { displayName: 'false' }, { donorContact: {} }]) assert.equal((await request('/reports', 'POST', { ...body, ...patch })).status, 400);
    assert.equal((await request('/reports', 'POST', { ...body, reportKey: randomUUID(), website: 'spam' })).status, 202);
    assert.equal(await Donation.countDocuments(), 1);
  });
  await t.test('confirmation races count once; cancellation/rejection do not count; audit contains no private values', async () => {
    const pending = await Donation.findOne({ status: 'pending' });
    const results = await Promise.all([request(`/admin/donations/${pending.id}/status`, 'PATCH', { status: 'confirmed' }, adminToken), request(`/admin/donations/${pending.id}/status`, 'PATCH', { status: 'confirmed' }, adminToken)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const publicData = (await request('')).data;
    assert.equal(publicData.stats.total, 180);
    assert.equal(publicData.recent[0].name, null);
    assert.ok(!JSON.stringify(publicData).includes('PRIVATE'));
    assert.equal(await Audit.countDocuments({ action: 'status_confirmed' }), 1);
    assert.ok(!JSON.stringify(await Audit.find().lean()).includes('PRIVATE'));
    assert.equal((await request(`/admin/donations/${pending.id}/status`, 'PATCH', { status: 'void' }, adminToken)).status, 200);
    assert.equal((await request('')).data.stats.total, 0);
    const report = { amount: 200, method: 'bank', reportKey: randomUUID() };
    await request('/reports', 'POST', report);
    const rejected = await Donation.findOne({ reportKey: report.reportKey });
    assert.equal((await request(`/admin/donations/${rejected.id}/status`, 'PATCH', { status: 'rejected' }, adminToken)).status, 200);
    assert.equal((await request('')).data.stats.total, 0);
  });
  await t.test('manual receipts need explicit confirmation, preserve idempotency and enforce threshold', async () => {
    assert.equal((await request('/admin/donations', 'POST', manual({ paymentConfirmed: false }), adminToken)).status, 400);
    const body = manual({ amount: 15000, donorName: 'Consenting donor', displayName: true });
    const results = await Promise.all([request('/admin/donations', 'POST', body, adminToken), request('/admin/donations', 'POST', body, adminToken)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
    assert.equal((await request('/admin/donations', 'POST', { ...body, amount: 10 }, adminToken)).status, 409);
    assert.equal((await request('')).data.stats.goal, 15000);
    assert.equal((await request('/admin/donations', 'POST', manual({ amount: 1 }), adminToken)).status, 201);
    const result = (await request('')).data;
    assert.equal(result.stats.total, 15001);
    assert.equal(result.stats.goal, 20000);
    assert.equal(result.stats.initialGoal, 15000);
    assert.equal(result.extendedPurpose, 'Test expansion purpose');
  });
  await t.test('stale edits cannot overwrite changes and changing identity removes inherited consent', async () => {
    const doc = await Donation.findOne({ donorName: 'Consenting donor' }).lean();
    const path = `/admin/donations/${doc._id}`;
    assert.equal((await request(path, 'PATCH', { expectedVersion: doc.__v, donorName: 'PRIVATE CHANGED' }, adminToken)).status, 200);
    assert.equal((await request(path, 'PATCH', { expectedVersion: doc.__v, amount: 42 }, adminToken)).status, 409);
    assert.ok(!JSON.stringify((await request('')).data).includes('PRIVATE CHANGED'));
    const version = (await request('/admin', 'GET', undefined, adminToken)).data.campaign.__v;
    assert.equal((await settings({ subtitle: 'Updated draft text' })).status, 200);
    assert.equal((await request('/admin/settings', 'PATCH', { expectedVersion: version, published: false }, adminToken)).status, 409);
  });
  await t.test('audit failures roll back creation, status, edit and settings changes', async () => {
    const oldCreate = Audit.create;
    const doc = await Donation.findOne({ status: 'confirmed' }).lean();
    const pending = await Donation.create({ amount: 42, method: 'bit', source: 'report', reportKey: randomUUID() });
    const count = await Donation.countDocuments();
    const current = await Campaign.findOne().lean();
    Audit.create = async () => { throw new Error('simulated audit outage'); };
    try {
      assert.equal((await request('/admin/donations', 'POST', manual(), adminToken)).status, 500);
      assert.equal((await request(`/admin/donations/${doc._id}`, 'PATCH', { expectedVersion: doc.__v, amount: 99 }, adminToken)).status, 500);
      assert.equal((await request(`/admin/donations/${pending.id}/status`, 'PATCH', { status: 'confirmed' }, adminToken)).status, 500);
      assert.equal((await request('/admin/settings', 'PATCH', { expectedVersion: current.__v, published: false }, adminToken)).status, 500);
    } finally { Audit.create = oldCreate; }
    assert.equal(await Donation.countDocuments(), count);
    assert.equal((await Donation.findById(doc._id)).amount, doc.amount);
    assert.equal((await Donation.findById(pending._id)).status, 'pending');
    assert.equal((await Campaign.findOne()).published, true);
  });
  await t.test('reports are rate limited and unpublishing closes every public endpoint', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await request('/reports', 'POST', { website: 'spam' }, undefined, '192.0.2.22')).status, 202);
    assert.equal((await request('/reports', 'POST', { website: 'spam' }, undefined, '192.0.2.22')).status, 429);
    assert.equal((await settings({ published: false })).status, 200);
    for (const [path, method, body] of [['', 'GET'], ['/bank-details', 'GET'], ['/reports', 'POST', {}]]) assert.equal((await request(path, method, body)).status, 404);
  });
});
