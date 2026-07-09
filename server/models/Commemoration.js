const mongoose = require('mongoose');

const commemorationSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'שם הפריט הוא שדה חובה'],
    trim: true,
  },
  commemorationStatus: {
    type: String,
    enum: ['commemorated', 'pending', 'none'],
    default: 'none',
  },
  // ← חובה רק כאשר הפריט אינו "פנוי להנצחה" (כלומר כבר יש מונצח/תורם בפועל)
  contributorName: {
    type: String,
    trim: true,
    default: '',
    required: [
      function () { return this.commemorationStatus !== 'none'; },
      'שם התורם הוא שדה חובה כאשר ההנצחה אינה פנויה',
    ],
  },
  commemoratedName: {
    type: String,
    trim: true,
    default: '',
    required: [
      function () { return this.commemorationStatus !== 'none'; },
      'שם המונצח הוא שדה חובה כאשר ההנצחה אינה פנויה',
    ],
  },
  amount: {
    type: Number,
    default: 0,
    min: [0, 'הסכום לא יכול להיות שלילי'],
    required: [
      function () { return this.commemorationStatus !== 'none'; },
      'סכום התרומה הוא שדה חובה כאשר ההנצחה אינה פנויה',
    ],
  },
  imageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Commemoration', commemorationSchema);