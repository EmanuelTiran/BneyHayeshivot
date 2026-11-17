// Local UI regression against the production build using synthetic API fixtures only.
// npm install --prefix .ariel-qa --no-save playwright
// npm run build --prefix client -- --outDir ../.ariel-qa/build
// node scripts/ariel-browser-check.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const express = require('../server/node_modules/express');
const { chromium } = require('../.ariel-qa/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'docs/ariel/screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const app = express();
app.use(express.static(path.join(root, '.ariel-qa/build')));
app.get('*', (_req, res) => res.sendFile(path.join(root, '.ariel-qa/build/index.html')));

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: process.env.ARIEL_BROWSER_CHANNEL || 'chrome', headless: true });
  try {
    for (const [name, width, height] of [['desktop', 1440, 1050], ['mobile', 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, locale: 'he-IL', timezoneId: 'Asia/Jerusalem' });
      const page = await context.newPage();
      const errors = [], calls = [], manualKeys = [];
      page.on('pageerror', error => errors.push(error.message));
      let published = true, authenticated = false, failManual = true;
      const campaign = { __v: 0, published: false, title: 'משפחה אחת, לב אחד', subtitle: 'מתגייסים יחד לסייע בהשלמת הבית', storyShort: 'יוזמה משפחתית לסיוע בהשלמת בית ובהוצאות הנלוות.', storyFull: '', beneficiaryName: '', showBeneficiaryName: false, showPersonalStory: false, organizerName: 'מארגן לדוגמה', extendedPurpose: 'השלמת הוצאות הבית', privacyNotice: 'נתוני הדיווח משמשים לבירור מול המארגן בלבד. לבקשת מחיקה פנו למארגן.', bitPhone: '050-0000000', bitLink: '', bankName: 'בנק לדוגמה', bankAccount: '000000', bankBranch: '000', bankHolder: 'מארגן לדוגמה', deadlineAt: '2020-01-01T00:00:00.000Z', allowReports: true };
      const stats = { total: 1000, count: 2, goal: 15000, initialGoal: 15000, extendedGoal: 20000, goalExtended: false, remaining: 14000, progress: 6.7 };
      const donations = [];
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith('/api/')) {
          calls.push(url.pathname);
          let status = 200, data = [];
          const method = route.request().method();
          if (url.pathname === '/api/auth/refresh') {
            status = authenticated ? 200 : 401;
            data = authenticated ? { token: 'synthetic-local-token', user: { _id: '507f1f77bcf86cd799439011', name: 'מנהל בדיקה', role: 'admin' } } : {};
          } else if (url.pathname === '/api/ariel') {
            status = published ? 200 : 404;
            data = published ? { ...campaign, beneficiaryName: null, bankAvailable: true, stats, recent: [{ id: '1', amount: 500, name: null }, { id: '2', amount: 500, name: 'משפחה לדוגמה' }] } : {};
          } else if (url.pathname === '/api/ariel/bank-details') {
            data = { bankName: campaign.bankName, branch: '000', account: '000000', holder: campaign.organizerName };
          } else if (url.pathname === '/api/ariel/reports') {
            status = 202; data = { message: 'הדיווח התקבל לבדיקה' };
          } else if (url.pathname === '/api/ariel/admin') {
            data = { campaign, stats, donations, events: [] };
          } else if (url.pathname === '/api/ariel/admin/donations' && method === 'POST') {
            const body = route.request().postDataJSON();
            manualKeys.push(body.reportKey);
            status = failManual ? 500 : 201;
            data = failManual ? { message: 'כשל זמני לבדיקה' } : { donation: body };
            if (!failManual) donations.push({ ...body, _id: '507f1f77bcf86cd799439012', __v: 0, status: 'confirmed', createdAt: new Date().toISOString() });
          } else if (url.pathname === '/api/ariel/admin/settings') {
            Object.assign(campaign, route.request().postDataJSON(), { __v: campaign.__v + 1 });
            data = { campaign };
          }
          return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data), headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
        }
        if (url.origin === base) return route.continue();
        // Keep screenshots and tests offline; no requests reach production or third parties.
        return route.abort();
      });
      await page.goto(base + '/ariel');
      await page.locator('#ariel-title').waitFor();
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow,noarchive');
      assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'), 'no-referrer');
      assert.equal(await page.locator('.ariel-page').count(), 1);
      assert.equal(await page.locator('.ariel-bank-details').count(), 0);
      assert.ok(calls.every(url => url.startsWith('/api/ariel')));
      assert.equal(await page.getByText(/נותרו \d+ ימים/).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      await page.screenshot({ path: path.join(screenshots, `public-${name}.png`), fullPage: true });
      await page.getByRole('button', { name: /הצגת פרטי חשבון/ }).click();
      await page.locator('.ariel-bank-details').waitFor();
      await page.getByRole('button', { name: /דיווח על תשלום/ }).click();
      await page.getByRole('button', { name: 'שליחת דיווח לבדיקה' }).click();
      await page.getByRole('status').filter({ hasText: 'דיווחכם התקבל' }).waitFor();
      await page.reload();
      await page.locator('#ariel-title').waitFor();
      published = false;
      // Trigger the normal poll without waiting twelve seconds.
      await page.clock.install();
      await page.clock.runFor(12500);
      await page.getByText('העמוד עדיין אינו זמין.').waitFor();
      assert.equal(await page.locator('#ariel-title').count(), 0);
      await page.clock.resume();
      await page.goto(base + '/admin/ariel');
      await page.waitForURL('**/login');
      assert.equal(await page.locator('a[href="/ariel"]').count(), 0);
      authenticated = true;
      await page.goto(base + '/admin/ariel');
      await page.getByRole('heading', { name: 'ניהול קמפיין משפחתי' }).waitFor();
      await page.getByLabel('סכום בשקלים', { exact: true }).fill('500');
      await page.getByLabel('בדקתי שהכסף התקבל בפועל').check();
      await page.getByRole('button', { name: 'הוספת תרומה מאושרת' }).click();
      await page.getByRole('alert').filter({ hasText: 'כשל זמני לבדיקה' }).waitFor();
      assert.equal(await page.getByLabel('סכום בשקלים', { exact: true }).inputValue(), '500');
      failManual = false;
      await page.getByRole('button', { name: 'הוספת תרומה מאושרת' }).click();
      await page.getByRole('status').filter({ hasText: 'התרומה נוספה ואושרה' }).waitFor();
      assert.equal(manualKeys[0], manualKeys[1]);
      await page.getByRole('button', { name: 'הגדרות ופרסום' }).click();
      assert.equal(await page.getByLabel('לפרסם את שם המוטב', { exact: true }).isChecked(), false);
      assert.equal(await page.getByLabel('לפרסם את הסיפור האישי', { exact: false }).isChecked(), false);
      await page.getByRole('button', { name: 'שמירת כל ההגדרות' }).click();
      await page.getByRole('status').filter({ hasText: 'ההגדרות נשמרו' }).waitFor();
      assert.equal(campaign.published, false);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(screenshots, `admin-${name}.png`), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      assert.deepEqual(errors, []);
      console.log(`${name}: standalone route, refresh, no analytics/auth, bank reveal, report, unpublish, existing admin guard, retry identity, draft settings, responsive layout passed`);
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
