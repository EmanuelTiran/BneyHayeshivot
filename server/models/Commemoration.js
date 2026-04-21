const mongoose = require('mongoose');

const commemorationSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'שם הפריט הוא שדה חובה'],
    trim: true,
  },
  contributorName: {
    type: String,
    required: [true, 'שם התורם הוא שדה חובה'],
    trim: true,
  },
  commemoratedName: {
    type: String,
    required: [true, 'שם המונצח הוא שדה חובה'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'סכום התרומה הוא שדה חובה'],
    min: [0, 'הסכום לא יכול להיות שלילי'],
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