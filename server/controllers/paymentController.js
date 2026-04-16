const service = require('../services/paymentService');

// ── משתמש רגיל: הנתונים שלו בלבד ────────────────────────────────────────────

exports.getMyPayments = async (req, res) => {
  try {
    const record = await service.getOrCreateByUser(req.user.userId);
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── אדמין: כלל המשתמשים ──────────────────────────────────────────────────────

exports.getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה אסורה' });
    }
    const all = await service.getAllPayments();
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה אסורה' });
    }
    const record = await service.getOrCreateByUser(req.params.userId);
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── חובות ────────────────────────────────────────────────────────────────────

exports.addDebt = async (req, res) => {
  try {
    const targetId = req.user.role === 'admin' && req.params.userId
      ? req.params.userId
      : req.user.userId;
    const record = await service.addDebt(targetId, req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.markDebtPaid = async (req, res) => {
  try {
    const targetId = req.user.role === 'admin' && req.params.userId
      ? req.params.userId
      : req.user.userId;
    const record = await service.markDebtPaid(targetId, req.params.debtId, req.body.isPaid);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteDebt = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה אסורה' });
    }
    const record = await service.deleteDebt(req.params.userId, req.params.debtId);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── הוראת קבע ────────────────────────────────────────────────────────────────

exports.setStandingOrder = async (req, res) => {
  try {
    const targetId = req.user.role === 'admin' && req.params.userId
      ? req.params.userId
      : req.user.userId;
    const record = await service.setStandingOrder(targetId, req.body);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.cancelStandingOrder = async (req, res) => {
  try {
    const targetId = req.user.role === 'admin' && req.params.userId
      ? req.params.userId
      : req.user.userId;
    const record = await service.cancelStandingOrder(targetId);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── תרומות ───────────────────────────────────────────────────────────────────

exports.addDonation = async (req, res) => {
  try {
    const targetId = req.user.role === 'admin' && req.params.userId
      ? req.params.userId
      : req.user.userId;
    const record = await service.addDonation(targetId, req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה אסורה' });
    }
    const record = await service.deleteDonation(req.params.userId, req.params.donationId);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── הערות ────────────────────────────────────────────────────────────────────

exports.updateNotes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה אסורה' });
    }
    const record = await service.updateNotes(req.params.userId, req.body.notes);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};