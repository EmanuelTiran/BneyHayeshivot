const announcementService = require('../services/announcementService');

exports.getAll = async (req, res) => {
    const data = await announcementService.getAll();
    res.json(data);
};

exports.create = async (req, res) => {
    const created = await announcementService.create(req.body);
    res.status(201).json(created);
};
const service = require('../services/announcementService');

exports.getAnnouncements = async (req, res) => {
  try {
    res.json(await service.getAllAnnouncements());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    res.status(201).json(await service.createAnnouncement(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const updated = await service.updateAnnouncement(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await service.deleteAnnouncement(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};