const mongoose = require('mongoose');

const sponsorshipRequestSchema = new mongoose.Schema({
  // פורטל — אופציונלי כי הנצחות לא עובדות עם PortalItem
  itemId:     { type: mongoose.Schema.Types.ObjectId, ref: 'PortalItem', default: null },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category',   default: null },

  // הנצחות — שם חופשי כשאין PortalItem
  itemName:        { type: String, default: '' },
  commemorationId: { type: String, default: '' }, // ה-_id של ה-Commemoration
  source:          { type: String, enum: ['portal', 'commemoration'], default: 'portal' },

  name:           { type: String, required: true, trim: true },
  phone:          { type: String, required: true, trim: true },
  email:          { type: String, required: true, trim: true, lowercase: true },
  dedicationType: {
    type: String,
    enum: ['לעילוי נשמת', 'לרפואת', 'לזכות', 'לעילוי נשמת ולהצלחת', 'אחר'],
    default: 'לזכות',
  },
  dedicationName: { type: String, default: '' },
  adminNote:      { type: String, default: '' },
  status:         { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('SponsorshipRequest', sponsorshipRequestSchema);