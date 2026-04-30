const GalleryImage = require('../models/GalleryImage');

exports.getAllImages = async () =>
  GalleryImage.find().sort({ order: 1, createdAt: 1 });

exports.createImage = async (data) => {
  const image = new GalleryImage(data);
  return image.save();
};

exports.updateImage = async (id, data) =>
  GalleryImage.findByIdAndUpdate(id, data, { new: true });

exports.deleteImage = async (id) =>
  GalleryImage.findByIdAndDelete(id);