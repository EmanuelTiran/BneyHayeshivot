const mongoose = require('mongoose');

// ── חוב בודד ─────────────────────────────────────────────────────────────────
const debtSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  dueDate:     { type: Date },
  isPaid:      { type: Boolean, default: false },
  paidAt:      { type: Date, default: null },
  createdAt:   { type: Date, default: Date.now }
});

// ── הוראת קבע ────────────────────────────────────────────────────────────────
const standingOrderSchema = new mongoose.Schema({
  amount:       { type: Number, required: true, min: 0 },
  dayOfMonth:   { type: Number, min: 1, max: 28, default: 1 },
  isActive:     { type: Boolean, default: true },
  description:  { type: String, default: 'הוראת קבע חודשית' },
  startDate:    { type: Date, default: Date.now },
  lastCharged:  { type: Date, default: null }
});

// ── תרומה בודדת ───────────────────────────────────────────────────────────────
const donationSchema = new mongoose.Schema({
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, default: 'תרומה' },
  date:        { type: Date, default: Date.now },
  receiptNumber: { type: String, default: '' }
});

// ── מסמך ראשי לכל משתמש ──────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true   // רשומה אחת לכל משתמש
  },
  debts:         { type: [debtSchema],         default: [] },
  standingOrder: { type: standingOrderSchema,  default: null },
  donations:     { type: [donationSchema],     default: [] },
  notes:         { type: String, default: '' },
  updatedAt:     { type: Date, default: Date.now }
});

// עדכן updatedAt אוטומטית
paymentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ── Virtual: סך חובות פתוחים ──────────────────────────────────────────────────
paymentSchema.virtual('totalDebt').get(function () {
  return this.debts
    .filter(d => !d.isPaid)
    .reduce((sum, d) => sum + d.amount, 0);
});

module.exports = mongoose.model('Payment', paymentSchema);