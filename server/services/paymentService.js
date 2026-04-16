const Payment = require('../models/Payment');

// ── קריאה ────────────────────────────────────────────────────────────────────

/** מחזיר את רשומת התשלום של משתמש (יוצר אם לא קיימת) */
const getOrCreateByUser = async (userId) => {
  let record = await Payment.findOne({ user: userId }).populate('user', 'name email');
  if (!record) {
    record = await Payment.create({ user: userId });
    record = await record.populate('user', 'name email');
  }
  return record;
};

/** מחזיר את כל רשומות התשלום – לאדמין בלבד */
const getAllPayments = async () => {
  return Payment.find().populate('user', 'name email phone').sort({ updatedAt: -1 });
};

// ── חובות ────────────────────────────────────────────────────────────────────

const addDebt = async (userId, debtData) => {
  const record = await getOrCreateByUser(userId);
  record.debts.push(debtData);
  return record.save();
};

const markDebtPaid = async (userId, debtId, isPaid) => {
  const record = await getOrCreateByUser(userId);
  const debt = record.debts.id(debtId);
  if (!debt) throw new Error('חוב לא נמצא');
  debt.isPaid = isPaid;
  debt.paidAt = isPaid ? new Date() : null;
  return record.save();
};

const deleteDebt = async (userId, debtId) => {
  const record = await getOrCreateByUser(userId);
  record.debts.pull(debtId);
  return record.save();
};

// ── הוראת קבע ────────────────────────────────────────────────────────────────

const setStandingOrder = async (userId, orderData) => {
  const record = await getOrCreateByUser(userId);
  record.standingOrder = orderData;
  return record.save();
};

const cancelStandingOrder = async (userId) => {
  const record = await getOrCreateByUser(userId);
  if (record.standingOrder) {
    record.standingOrder.isActive = false;
  }
  return record.save();
};

// ── תרומות ───────────────────────────────────────────────────────────────────

const addDonation = async (userId, donationData) => {
  const record = await getOrCreateByUser(userId);
  record.donations.push(donationData);
  return record.save();
};

const deleteDonation = async (userId, donationId) => {
  const record = await getOrCreateByUser(userId);
  record.donations.pull(donationId);
  return record.save();
};

// ── הערות (אדמין) ─────────────────────────────────────────────────────────────

const updateNotes = async (userId, notes) => {
  const record = await getOrCreateByUser(userId);
  record.notes = notes;
  return record.save();
};

module.exports = {
  getOrCreateByUser,
  getAllPayments,
  addDebt,
  markDebtPaid,
  deleteDebt,
  setStandingOrder,
  cancelStandingOrder,
  addDonation,
  deleteDonation,
  updateNotes,
};