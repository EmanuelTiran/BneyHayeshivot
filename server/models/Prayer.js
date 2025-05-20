const mongoose = require('mongoose');

const prayerSchema = new mongoose.Schema({
  date: String,
  time: String,
  type: String, // שחרית, מנחה וכו'
});

module.exports = mongoose.model('Prayer', prayerSchema);