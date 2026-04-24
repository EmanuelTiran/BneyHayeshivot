const mongoose = require('mongoose');

const sponsorshipRequestSchema = new mongoose.Schema({
  itemId:         { type: mongoose.Schema.Types.ObjectId, ref: 'PortalItem', required: true },
  categoryId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Category',   required: true },
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
