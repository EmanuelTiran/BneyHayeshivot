const mongoose = require('mongoose');

const portalItemSchema = new mongoose.Schema({
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date:        { type: String, default: '' },
  price:       { type: Number, default: 0 },
  available:   { type: Boolean, default: true },
  order:       { type: Number, default: 0 },

  // ← חדש: משתייך לסנכרון עם בקשות הקדשה
  sponsorshipStatus: { type: String, enum: ['available', 'pending', 'sponsored'], default: 'available' },
  dedicatedName:      { type: String, default: '' }, // שם לציון בהנצחה, לאחר אישור
  dedicationType:     { type: String, default: '' }, // "לזכות" / "לעילוי נשמת" וכו'
}, { timestamps: true });

module.exports = mongoose.model('PortalItem', portalItemSchema);