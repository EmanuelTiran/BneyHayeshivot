'use strict';
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  campaignKey: { type: String, default: 'ariel', immutable: true },
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ArielDonation', default: null },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true, versionKey: false });
eventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ArielAuditEvent', eventSchema);
