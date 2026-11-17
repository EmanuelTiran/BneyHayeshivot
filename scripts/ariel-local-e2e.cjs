// Real local UI -> existing Express server -> disposable MongoDB replica set.
// Requires existing client/server dependencies and .ariel-qa Playwright tools.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { MongoMemoryReplSet } = require('../server/node_modules/mongodb-memory-server');
const mongoose = require('../server/node_modules/mongoose');
const { chromium } = require('../.ariel-qa/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const work = path.join(root, '.ariel-qa/local-e2e');
fs.mkdirSync(work, { recursive: true });
const results = [];
let mongo, api, vite, browser;
const base = 'http://127.0.0.1:5174';
let apiBase;
const password = 'Disposable-local-only-2026!';
async function waitUntil(check, label, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await check()) return; await new Promise(r => setTimeout(r, 200)); }
  throw new Error(`Timed out: ${label}`);
}
async function ensureFree(port) {
  const net = require('node:net');
  return new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(port, '127.0.0.1', () => { const selected = s.address().port; s.close(() => resolve(selected)); }); });
}
(async () => {
  const apiPort = await ensureFree(0); await ensureFree(5174);
  apiBase = `http://127.0.0.1:${apiPort}`;
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri('ariel_local_e2e');
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:/);
  await mongoose.connect(uri);
  const User = require('../server/models/User');
  const seeded = await User.create({ name: 'Local test administrator', email: 'admin@example.invalid', password, role: 'admin', receivesNewsletter: false });
  assert.equal(await seeded.comparePassword(password), true);
  const env = {};
  assert.equal(fs.existsSync(path.join(work, '.env')), false, 'Test working directory must not contain .env');
  for (const k of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT']) if (process.env[k]) env[k] = process.env[k];
  Object.assign(env, { NODE_ENV: 'test', MONGO_URI: uri, JWT_SECRET: 'local-e2e-test-only-secret', ANALYTICS_HASH_SECRET: 'local-e2e-test-only-analytics-secret', PORT: String(apiPort), CLIENT_URL: base });
  // No inherited production secrets; cwd has no .env. Only bind loopback.
  const bootstrap = `const http=require('node:http');const listen=http.Server.prototype.listen;http.Server.prototype.listen=function(port,cb){return listen.call(this,port,'127.0.0.1',cb)};require(${JSON.stringify(path.join(root, 'server/server.js'))});`;
  api = spawn(process.execPath, ['-e', bootstrap], { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let apiLog = '';
  api.stdout.on('data', x => { apiLog += x; }); api.stderr.on('data', x => { apiLog += x; });
  await waitUntil(async () => { if (api.exitCode !== null) throw new Error('Local Express startup failed: ' + apiLog); if (!apiLog.includes('MongoDB connected') || !apiLog.includes('Server running')) return false; try { return (await fetch(apiBase + '/api/health')).ok; } catch { return false; } }, 'Express startup');
  const probe = await fetch(apiBase + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.invalid', password }) });
  if (!probe.ok) {
    console.log('TEST parent DB', mongoose.connection.name, 'users', await User.countDocuments(), 'reloaded password valid', await (await User.findOne({email:'admin@example.invalid'})).comparePassword(password));
    console.log('TEST Express output', apiLog);
  }
  assert.equal(probe.status, 200, 'real local login prerequisite: ' + (probe.ok ? 'ok' : await probe.text()));
  process.chdir(path.join(root, 'client'));
  const { createServer } = await import(pathToFileURL(path.join(root, 'client/node_modules/vite/dist/node/index.js')).href);
  const react = (await import(pathToFileURL(path.join(root, 'client/node_modules/@vitejs/plugin-react/dist/index.mjs')).href)).default;
  const localApiConfig = { name: 'local-e2e-api-address', enforce: 'pre', transform(code, id) { if (id.replaceAll('\\', '/') === path.join(root, 'client/src/config.js').replaceAll('\\', '/')) return `export const API_URL = ${JSON.stringify(apiBase)};`; } };
  vite = await createServer({ root: path.join(root, 'client'), configFile: false, envFile: false, mode: 'test', plugins: [localApiConfig, react()], define: { 'import.meta.env.VITE_ANALYTICS_ENABLED': JSON.stringify('false'), 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('local-only.apps.googleusercontent.com') }, server: { host: '127.0.0.1', port: 5174, strictPort: true } });
  await vite.listen();
  browser = await chromium.launch({ channel: process.env.ARIEL_BROWSER_CHANNEL || 'chrome', headless: true });
  const Campaign = require('../server/models/ArielCampaign');
  const Donation = require('../server/models/ArielDonation');
  for (const [name, width, height] of [['desktop', 1440, 1050], ['mobile', 390, 844]]) {
    const adminCtx = await browser.newContext({ viewport: { width, height }, locale: 'he-IL' });
    const donorCtx = await browser.newContext({ viewport: { width, height }, locale: 'he-IL' });
    for (const ctx of [adminCtx, donorCtx]) await ctx.route('**/*', route => {
      const u = new URL(route.request().url());
      // Egress guard only: no API mocking, fulfilling or rewriting requests.
      return ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) ? route.continue() : route.abort();
    });
    const admin = await adminCtx.newPage(), donor = await donorCtx.newPage();
    admin.on('dialog', dialog => dialog.accept());
    await donor.goto(base + '/ariel');
    await donor.getByText('העמוד עדיין אינו זמין.').waitFor();
    assert.equal((await donorCtx.request.get(apiBase + '/api/ariel')).status(), 404);
    await admin.goto(base + '/admin/ariel');
    await admin.waitForURL('**/login');
    await admin.locator('#email').fill('admin@example.invalid');
    await admin.locator('#password').fill(password);
    const login = admin.waitForResponse(r => r.url() === apiBase + '/api/auth/login' && r.request().method() === 'POST');
    await admin.locator('form button[type="submit"]').click();
    const loginResponse = await login;
    assert.deepEqual(loginResponse.request().postDataJSON(), { email: 'admin@example.invalid', password });
    assert.equal(loginResponse.status(), 200, await loginResponse.text());
    await admin.waitForURL(base + '/');
    await admin.goto(base + '/admin/ariel');
    await admin.getByRole('heading', { name: 'ניהול קמפיין משפחתי' }).waitFor();
    assert.ok((await adminCtx.cookies()).some(c => c.name === 'refreshToken' && c.httpOnly));
    await admin.getByRole('button', { name: 'הגדרות ופרסום' }).click();
    for (const [field, value] of Object.entries({ organizerName: 'Local demo organizer', extendedPurpose: 'Synthetic expansion purpose', bankName: 'Demo bank', bankAccount: '000000', bankBranch: '000' })) await admin.locator(`[name="${field}"]`).fill(value);
    await admin.locator('[name="privacyNotice"]').fill('Disposable synthetic local test only; all records removed after the run.');
    await admin.locator('[name="published"]').check();
    await admin.getByRole('button', { name: 'שמירת כל ההגדרות' }).click();
    await admin.getByRole('status').filter({ hasText: 'ההגדרות נשמרו' }).waitFor();
    assert.equal((await Campaign.findOne()).published, true);
    await donor.reload(); await donor.locator('#ariel-title').waitFor();
    await donor.getByRole('button', { name: /הצגת פרטי חשבון/ }).click();
    await donor.locator('.ariel-bank-details').waitFor();
    assert.match(await donor.locator('.ariel-bank-details').textContent(), /000000/);
    await donor.getByRole('button', { name: /דיווח על תשלום/ }).click();
    await donor.getByRole('button', { name: 'שליחת דיווח לבדיקה' }).click();
    await donor.getByRole('status').filter({ hasText: 'דיווחכם התקבל' }).waitFor();
    assert.equal(await Donation.countDocuments({ status: 'pending', amount: 180 }), 1);
    assert.equal((await (await donorCtx.request.get(apiBase + '/api/ariel')).json()).stats.total, 0);
    await admin.getByRole('button', { name: 'תרומות', exact: true }).click();
    await admin.getByRole('button', { name: /רענון/ }).click();
    await admin.locator('button[title="אישור"]').click();
    await waitUntil(async () => await Donation.countDocuments({ status: 'confirmed', amount: 180 }) === 1, 'confirmed DB record');
    // Observe the application's real 12-second polling; no clock changes or reload.
    await donor.waitForFunction(() => document.querySelector('.ariel-progress-total strong')?.textContent.includes('180'), { timeout: 25000 });
    async function add(amount) {
      await admin.getByLabel('סכום בשקלים', { exact: true }).fill(String(amount));
      await admin.getByLabel('בדקתי שהכסף התקבל בפועל').check();
      await admin.getByRole('button', { name: 'הוספת תרומה מאושרת' }).click();
      await admin.getByRole('status').filter({ hasText: 'התרומה נוספה ואושרה' }).waitFor();
    }
    await add(14820);
    await waitUntil(async () => (await (await donorCtx.request.get(apiBase + '/api/ariel')).json()).stats.total === 15000, 'initial threshold');
    assert.equal((await (await donorCtx.request.get(apiBase + '/api/ariel')).json()).stats.goal, 15000);
    await add(1);
    await donor.waitForFunction(() => document.querySelector('.ariel-extended')?.textContent.includes('20,000'), { timeout: 25000 });
    const expanded = (await (await donorCtx.request.get(apiBase + '/api/ariel')).json()).stats;
    assert.equal(expanded.total, 15001); assert.equal(expanded.goal, 20000);
    // Newest donation is first in the existing administrator list.
    await admin.locator('tbody tr').first().locator('button[title="ביטול תרומה"]').click();
    await waitUntil(async () => await Donation.countDocuments({ status: 'void', amount: 1 }) === 1, 'void record');
    await donor.waitForFunction(() => !document.querySelector('.ariel-extended') && document.querySelector('.ariel-progress-total strong')?.textContent.includes('15,000'), { timeout: 25000 });
    assert.equal((await (await donorCtx.request.get(apiBase + '/api/ariel')).json()).stats.goal, 15000);
    assert.equal(await donor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await donor.screenshot({ path: path.join(work, `${name}-confirmed.png`), fullPage: true });
    await admin.getByRole('button', { name: 'הגדרות ופרסום' }).click();
    await admin.locator('[name="published"]').uncheck();
    await admin.getByRole('button', { name: 'שמירת כל ההגדרות' }).click();
    await admin.getByRole('status').filter({ hasText: 'ההגדרות נשמרו' }).waitFor();
    await donor.getByText('העמוד עדיין אינו זמין.').waitFor({ timeout: 25000 });
    for (const p of ['/api/ariel', '/api/ariel/bank-details']) assert.equal((await donorCtx.request.get(apiBase + p)).status(), 404);
    assert.equal((await donorCtx.request.post(apiBase + '/api/ariel/reports', { data: {} })).status(), 404);
    await donor.reload(); await donor.getByText('העמוד עדיין אינו זמין.').waitFor();
    results.push({ viewport: name, checks: '10/10 passed', totalBeforeCleanup: 15000, pending: 0, confirmed: 2, void: 1 });
    await adminCtx.close(); await donorCtx.close();
    // Only this disposable local database is reset between viewports.
    await Donation.deleteMany({});
    await Campaign.deleteMany({});
    console.log(`${name}: real login, draft, publish, pending, confirm, polling, goals, void, unpublish, responsive passed`);
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (vite) await vite.close();
  if (api) { api.kill(); await new Promise(resolve => api.exitCode !== null ? resolve() : api.once('exit', resolve)); }
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  fs.writeFileSync(path.join(work, 'results.json'), JSON.stringify({ results, cleanup: 'browser, Vite, Express and disposable MongoDB stopped' }, null, 2));
});
