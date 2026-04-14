const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
  handled: { type: Boolean, default: false },
  handledAt: { type: Date, default: null }
});

module.exports = mongoose.model('ContactMessage', contactSchema);
