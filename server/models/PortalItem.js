const mongoose = require('mongoose');

const portalItemSchema = new mongoose.Schema({
  categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date:        { type: String, default: '' },
  price:       { type: Number, default: 0 },
  available:   { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PortalItem', portalItemSchema);