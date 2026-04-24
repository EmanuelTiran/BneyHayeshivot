const service = require('../services/categoryService');

exports.getAll = async (req, res) => {
  try { res.json(await service.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const item = await service.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'לא נמצא' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try { res.status(201).json(await service.create(req.body)); }
  catch (err) { res.status(400).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const updated = await service.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'לא נמצא' });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ message: 'נמחק בהצלחה' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
