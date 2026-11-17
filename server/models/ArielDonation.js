'use strict';
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  campaignKey: { type: String, default: 'ariel', immutable: true, index: true },
  amount: { type: Number, required: true, min: 1, max: 1000000, validate: Number.isSafeInteger },
  method: { type: String, enum: ['bit', 'bank', 'other'], required: true },
  source: { type: String, enum: ['report', 'manual'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'void'], default: 'pending', index: true },
  donorName: { type: String, default: '' },
  donorContact: { type: String, default: '' },
  displayName: { type: Boolean, default: false },
  reference: { type: String, default: '' },
  note: { type: String, default: '' },
  reportKey: { type: String, required: true }, // Idempotency for public and manual submissions.
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

donationSchema.index({ reportKey: 1 }, { unique: true, partialFilterExpression: { reportKey: { $type: 'string' } } });
donationSchema.index({ campaignKey: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ArielDonation', donationSchema);
