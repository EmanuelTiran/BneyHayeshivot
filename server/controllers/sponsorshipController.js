const service           = require('../services/sponsorshipService');
const portalItemService = require('../services/portalItemService');
const categoryService   = require('../services/categoryService');

exports.create = async (req, res) => {
  try {
    const { itemId, categoryId } = req.body;
    const [item, category] = await Promise.all([
      portalItemService.getById(itemId),
      categoryService.getById(categoryId),
    ]);
    if (!item || !category) return res.status(404).json({ message: 'פריט או קטגוריה לא נמצאו' });
    const request = await service.create(req.body, item.title, category.name);
    res.status(201).json(request);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getAll = async (req, res) => {
  try { res.json(await service.getAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const updated = await service.updateStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ message: 'לא נמצא' });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
};
// ← חדש — בקשה מדף ההנצחות (ללא itemId/categoryId)
exports.createFromCommemoration = async (req, res) => {
  try {
    const { itemName, commemorationId } = req.body;
    if (!itemName) return res.status(400).json({ message: 'חסר שם פריט' });

    const request = await service.create(
      { ...req.body, source: 'commemoration' },
      itemName,
      'הנצחות'
    );
    res.status(201).json(request);
  } catch (err) { res.status(400).json({ message: err.message }); }
};