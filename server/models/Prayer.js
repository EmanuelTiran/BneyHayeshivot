const mongoose = require('mongoose');

const prayerSchema = new mongoose.Schema({
  description: String,
  time: String,
  title: String, // שחרית, מנחה וכו'
});

module.exports = mongoose.model('Prayer', prayerSchema);