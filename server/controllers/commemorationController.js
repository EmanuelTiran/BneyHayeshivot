const service = require('../services/commemorationService');

/**
 * GET /api/commemorations
 * מחזיר את כל ההנצחות (פתוח לכולם)
 */
exports.getCommemorations = async (req, res) => {
  try {
    const data = await service.getAllCommemorations();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/commemorations/:id
 * מחזיר הנצחה בודדת לפי מזהה
 */
exports.getCommemorationById = async (req, res) => {
  try {
    const item = await service.getCommemorationById(req.params.id);
    if (!item) return res.status(404).json({ message: 'ההנצחה לא נמצאה' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/commemorations
 * יוצר הנצחה חדשה (מנהל בלבד)
 */
exports.createCommemoration = async (req, res) => {
  try {
    const created = await service.createCommemoration(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PUT /api/commemorations/:id
 * מעדכן הנצחה קיימת (מנהל בלבד)
 */
exports.updateCommemoration = async (req, res) => {
  try {
    const updated = await service.updateCommemoration(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'ההנצחה לא נמצאה' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/commemorations/:id
 * מוחק הנצחה (מנהל בלבד)
 */
exports.deleteCommemoration = async (req, res) => {
  try {
    const deleted = await service.deleteCommemoration(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'ההנצחה לא נמצאה' });
    res.json({ message: 'ההנצחה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/**
 * PATCH /api/commemorations/:id/status
 * מעדכן רק את סטטוס ההנצחה (מנהל בלבד)
 */
exports.updateCommemorationStatus = async (req, res) => {
  try {
    const { commemorationStatus } = req.body;
    const valid = ['commemorated', 'pending', 'none'];
    if (!valid.includes(commemorationStatus)) {
      return res.status(400).json({ message: 'סטטוס לא תקין' });
    }
    const updated = await service.updateCommemoration(req.params.id, { commemorationStatus });
    if (!updated) return res.status(404).json({ message: 'ההנצחה לא נמצאה' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};