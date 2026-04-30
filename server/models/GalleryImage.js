const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  imageUrl:    { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  order:       { type: Number, default: 0 },
  createdAt:   { type: Date,   default: Date.now },
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);