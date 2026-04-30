const service = require('../services/galleryService');

exports.getImages = async (req, res) => {
  try {
    res.json(await service.getAllImages());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createImage = async (req, res) => {
  try {
    res.status(201).json(await service.createImage(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const updated = await service.updateImage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    await service.deleteImage(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};