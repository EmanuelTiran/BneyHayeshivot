'use strict';
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const mongoose = require('mongoose');
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdminMiddleware');
const Campaign = require('../models/ArielCampaign');
const Donation = require('../models/ArielDonation');
const Audit = require('../models/ArielAuditEvent');
const { validAmount, cleanText, paymentMethod, statsFromDonations, publicRecent, isSafePaymentUrl } = require('../services/arielCampaignLogic');

const router = express.Router();
const limiter = (windowMs, limit) => rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false });
const admin = [protect, requireAdmin];
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(err => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (['ValidationError', 'CastError'].includes(err.name)) return res.status(400).json({ message: 'נתונים לא תקינים' });
  return next(err);
});
router.use((_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer' });
  next();
});
// Public reads do not initialize or modify campaign records.
const getCampaign = async () => (await Campaign.findOne({ key: 'ariel' }).lean()) || new Campaign().toObject();
const getConfirmed = () => Donation.find({ campaignKey: 'ariel', status: 'confirmed' })
  .select('_id amount status displayName donorName createdAt confirmedAt').lean();

router.get('/', limiter(60000, 120), wrap(async (_req, res) => {
  const c = await getCampaign();
  if (!c.published) return res.sendStatus(404);
  const confirmed = await getConfirmed();
  const stats = statsFromDonations(confirmed, c);
  return res.json({ title: c.title, subtitle: c.subtitle,
    storyShort: c.showPersonalStory ? c.storyShort : 'יוזמה משפחתית לסיוע בהשלמת בית ובהוצאות הנלוות.',
    storyFull: c.showPersonalStory ? c.storyFull : '',
    beneficiaryName: c.showBeneficiaryName ? c.beneficiaryName : null,
    organizerName: c.organizerName, deadlineAt: c.deadlineAt, allowReports: c.allowReports,
    privacyNotice: c.privacyNotice, bitPhone: c.bitPhone, bitLink: isSafePaymentUrl(c.bitLink) ? c.bitLink : '',
    bankAvailable: Boolean(c.bankName && c.bankAccount), extendedPurpose: stats.goalExtended ? c.extendedPurpose : null,
    stats, recent: publicRecent(confirmed) });
}));
router.get('/bank-details', limiter(60000, 120), wrap(async (_req, res) => {
  const c = await getCampaign();
  if (!c.published || !c.bankName || !c.bankAccount) return res.sendStatus(404);
  return res.json({ bankName: c.bankName, branch: c.bankBranch, account: c.bankAccount, holder: c.bankHolder });
}));
function validateBody(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'נתונים לא תקינים');
  return input;
}
function text(input, key, max) {
  if (has(input, key) && (typeof input[key] !== 'string' || input[key].length > max)) fail(400, `שדה לא תקין: ${key}`);
  return cleanText(input[key], max);
}
function boolean(input, key) {
  if (has(input, key) && typeof input[key] !== 'boolean') fail(400, `שדה לא תקין: ${key}`);
  return input[key] === true;
}
function donorFields(input) {
  const donorName = text(input, 'donorName', 80);
  return { donorName, donorContact: text(input, 'donorContact', 120), reference: text(input, 'reference', 120), displayName: boolean(input, 'displayName') && Boolean(donorName) };
}
router.post('/reports', limiter(15 * 60000, 5), wrap(async (req, res) => {
  const c = await getCampaign();
  if (!c.published || !c.allowReports) return res.sendStatus(404);
  const input = validateBody(req.body);
  if (input.website) return res.status(202).json({ message: 'הדיווח התקבל לבדיקה' });
  if (!validAmount(input.amount) || !paymentMethod(input.method) || typeof input.reportKey !== 'string' || !uuid.test(input.reportKey)) fail(400, 'סכום, אמצעי תשלום או מזהה דיווח לא תקינים');
  await Donation.init(); // Wait for the unique idempotency index before accepting reports.
  try {
    await Donation.create({ ...donorFields(input), amount: input.amount, method: input.method, reportKey: input.reportKey.toLowerCase(), source: 'report', status: 'pending' });
  } catch (err) { if (err.code !== 11000) throw err; }
  // Idempotent retries never disclose private donor data.
  return res.status(202).json({ message: 'הדיווח התקבל לבדיקה. הסכום יתעדכן רק לאחר אימות התשלום.' });
}));
router.get('/admin', ...admin, wrap(async (_req, res) => {
  const [campaign, donations, events, confirmed] = await Promise.all([
    getCampaign(), Donation.find({ campaignKey: 'ariel' }).sort({ createdAt: -1 }).limit(500).lean(),
    Audit.find({ campaignKey: 'ariel' }).sort({ createdAt: -1 }).limit(80).lean(), getConfirmed(),
  ]);
  return res.json({ campaign, donations, events, stats: statsFromDonations(confirmed, campaign) });
}));

// Financial changes and audit events commit together. Standalone MongoDB fails closed.
let ready;
async function atomic(work) {
  if (!ready) ready = Promise.all([Campaign.init(), Donation.init(), Audit.init()]).catch(err => { ready = null; throw err; });
  await ready;
  return mongoose.connection.transaction(work);
}
function snapshot(doc) {
  return doc ? { status: doc.status, amount: doc.amount, method: doc.method, displayName: doc.displayName } : null;
}
async function audit(session, actorId, action, donationId, before, after) {
  await Audit.create([{ actorId, action, donationId, before: snapshot(before), after: snapshot(after) }], { session });
}
const settingsText = ['title', 'subtitle', 'storyShort', 'storyFull', 'beneficiaryName', 'organizerName', 'extendedPurpose', 'privacyNotice', 'bitPhone', 'bitLink', 'bankName', 'bankBranch', 'bankAccount', 'bankHolder'];
router.patch('/admin/settings', ...admin, wrap(async (req, res) => {
  const input = validateBody(req.body);
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) fail(400, 'גרסת הגדרות חסרה');
  const patch = {};
  for (const key of settingsText) if (has(input, key)) patch[key] = text(input, key, ['storyFull', 'storyShort', 'privacyNotice'].includes(key) ? 3000 : 220);
  for (const key of ['showBeneficiaryName', 'showPersonalStory', 'allowReports', 'published']) if (has(input, key)) patch[key] = boolean(input, key);
  if (has(input, 'deadlineAt')) {
    if (input.deadlineAt === null || input.deadlineAt === '') patch.deadlineAt = null;
    else {
      if (typeof input.deadlineAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input.deadlineAt)) fail(400, 'תאריך סיום חייב לכלול אזור זמן');
      patch.deadlineAt = new Date(input.deadlineAt);
      if (!Number.isFinite(patch.deadlineAt.getTime())) fail(400, 'תאריך סיום לא תקין');
    }
  }
  const campaign = await atomic(async session => {
    let current = await Campaign.findOne({ key: 'ariel' }).session(session).lean();
    if (!current) { const [doc] = await Campaign.create([{ key: 'ariel' }], { session }); current = doc.toObject(); }
    if (current.__v !== input.expectedVersion) fail(409, 'ההגדרות השתנו. רענן ונסה שוב');
    const resulting = { ...current, ...patch };
    if (!isSafePaymentUrl(resulting.bitLink)) fail(400, 'קישור ביט חייב להיות כתובת HTTPS תקינה');
    if (resulting.bitPhone && !/^\+?[\d -]{9,20}$/.test(resulting.bitPhone)) fail(400, 'מספר טלפון לביט לא תקין');
    for (const key of ['bankBranch', 'bankAccount']) if (resulting[key] && !/^[\d -]{1,30}$/.test(resulting[key])) fail(400, 'פרטי חשבון לא תקינים');
    if (resulting.published) {
      if (!resulting.title || !resulting.organizerName || !resulting.extendedPurpose || !resulting.privacyNotice) fail(400, 'לפני פרסום נדרשים כותרת, שם מקבל הכספים, ייעוד הרחבה ומדיניות פרטיות ומחיקה');
      if (!resulting.bitPhone && !resulting.bitLink && !(resulting.bankName && resulting.bankAccount)) fail(400, 'לפני פרסום נדרש אמצעי תשלום');
    }
    const updated = await Campaign.findOneAndUpdate({ key: 'ariel', __v: input.expectedVersion }, { $set: patch, $inc: { __v: 1 } }, { new: true, runValidators: true, session }).lean();
    if (!updated) fail(409, 'ההגדרות השתנו. רענן ונסה שוב');
    await Audit.create([{ actorId: req.user.userId, action: 'settings_updated', before: { published: current.published, showBeneficiaryName: current.showBeneficiaryName, showPersonalStory: current.showPersonalStory }, after: { published: updated.published, showBeneficiaryName: updated.showBeneficiaryName, showPersonalStory: updated.showPersonalStory, fields: Object.keys(patch) } }], { session });
    return updated;
  });
  return res.json({ campaign });
}));
router.post('/admin/donations', ...admin, wrap(async (req, res) => {
  const input = validateBody(req.body);
  if (!validAmount(input.amount) || !['bit', 'bank', 'other'].includes(input.method) || input.paymentConfirmed !== true) fail(400, 'יש להזין סכום תקין ולאשר שהכסף התקבל');
  if (typeof input.reportKey !== 'string' || !input.reportKey.startsWith('manual-') || !uuid.test(input.reportKey.slice(7))) fail(400, 'מזהה פעולה לא תקין');
  const item = { ...donorFields(input), amount: input.amount, method: input.method, note: text(input, 'note', 500), reportKey: input.reportKey.toLowerCase(), source: 'manual', status: 'confirmed' };
  try {
    const donation = await atomic(async session => {
      const [doc] = await Donation.create([{ ...item, confirmedAt: new Date(), confirmedBy: req.user.userId }], { session });
      await audit(session, req.user.userId, 'manual_donation', doc._id, null, doc);
      return doc;
    });
    return res.status(201).json({ donation });
  } catch (err) {
    if (err.code !== 11000) throw err;
    const existing = await Donation.findOne({ reportKey: item.reportKey, source: 'manual', campaignKey: 'ariel' }).lean();
    if (!existing || Object.keys(item).some(key => existing[key] !== item[key])) fail(409, 'מזהה הפעולה כבר בשימוש עם נתונים אחרים');
    return res.json({ donation: existing, duplicateRequest: true });
  }
}));
router.patch('/admin/donations/:id/status', ...admin, wrap(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) fail(400, 'מזהה תרומה לא תקין');
  const requested = req.body?.status;
  const from = ['confirmed', 'rejected'].includes(requested) ? 'pending' : requested === 'void' ? 'confirmed' : null;
  if (!from) fail(400, 'מעבר סטטוס אינו נתמך');
  const donation = await atomic(async session => {
    const before = await Donation.findOne({ _id: req.params.id, campaignKey: 'ariel', status: from }).session(session).lean();
    if (!before) fail(409, 'התרומה השתנתה או אינה במצב המתאים');
    const update = { status: requested };
    if (requested === 'confirmed') Object.assign(update, { confirmedAt: new Date(), confirmedBy: req.user.userId });
    const doc = await Donation.findOneAndUpdate({ _id: before._id, campaignKey: 'ariel', status: from, __v: before.__v }, { $set: update, $inc: { __v: 1 } }, { new: true, runValidators: true, session }).lean();
    if (!doc) fail(409, 'הפעולה כבר בוצעה');
    await audit(session, req.user.userId, `status_${requested}`, doc._id, before, doc);
    return doc;
  });
  return res.json({ donation });
}));
router.patch('/admin/donations/:id', ...admin, wrap(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) fail(400, 'מזהה תרומה לא תקין');
  const input = validateBody(req.body);
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) fail(400, 'גרסת תרומה חסרה');
  const patch = {};
  if (has(input, 'amount')) { if (!validAmount(input.amount)) fail(400, 'סכום לא תקין'); patch.amount = input.amount; }
  for (const key of ['donorName', 'donorContact', 'reference', 'note']) if (has(input, key)) patch[key] = text(input, key, key === 'note' ? 500 : key === 'donorName' ? 80 : 120);
  if (has(input, 'displayName')) patch.displayName = boolean(input, 'displayName');
  // A changed identity requires renewed explicit permission to publish its name.
  if (has(patch, 'donorName') && input.displayName !== true) patch.displayName = false;
  if (patch.donorName === '') patch.displayName = false;
  if (!Object.keys(patch).length) fail(400, 'לא נמסרו שינויים');
  const donation = await atomic(async session => {
    const old = await Donation.findOne({ _id: req.params.id, campaignKey: 'ariel' }).session(session).lean();
    if (!old) fail(404, 'התרומה לא נמצאה');
    if (old.__v !== input.expectedVersion) fail(409, 'התרומה השתנתה. רענן ונסה שוב');
    if (patch.displayName && !(patch.donorName ?? old.donorName)) patch.displayName = false;
    const updated = await Donation.findOneAndUpdate({ _id: old._id, campaignKey: 'ariel', __v: input.expectedVersion }, { $set: patch, $inc: { __v: 1 } }, { new: true, runValidators: true, session }).lean();
    if (!updated) fail(409, 'התרומה השתנתה. רענן ונסה שוב');
    await audit(session, req.user.userId, 'donation_edited', updated._id, old, updated);
    return updated;
  });
  return res.json({ donation });
}));

router.delete('/admin/donations/:id', ...admin, wrap(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) fail(400, 'מזהה תרומה לא תקין');
  const input = validateBody(req.body);
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) fail(400, 'גרסת תרומה חסרה');
  // Remove the database row, but keep a privacy-safe audit event in the same transaction.
  await atomic(async session => {
    const before = await Donation.findOne({ _id: req.params.id, campaignKey: 'ariel' }).session(session).lean();
    if (!before) fail(404, 'התרומה לא נמצאה');
    if (before.__v !== input.expectedVersion) fail(409, 'התרומה השתנתה. רענן ונסה שוב');
    const result = await Donation.deleteOne({
      _id: before._id, campaignKey: 'ariel', __v: input.expectedVersion,
    }, { session });
    if (result.deletedCount !== 1) fail(409, 'התרומה השתנתה. רענן ונסה שוב');
    await audit(session, req.user.userId, 'donation_deleted', before._id, before, null);
  });
  return res.json({ deleted: true, id: req.params.id });
}));
module.exports = router;
