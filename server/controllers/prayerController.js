const prayerService = require('../services/prayerService');

exports.getAll = async (req, res) => {
  const prayers = await prayerService.getAll();
  res.json(prayers);
};

exports.create = async (req, res) => {
  const saved = await prayerService.create(req.body);
  res.status(201).json(saved);
};