const contactService = require('../services/contactService');

exports.getAll = async (req, res) => {
  const filters = {};

  if (req.query.handled === 'true') {
    filters.handled = true;
  } else if (req.query.handled === 'false') {
    filters.handled = false;
  }

  const data = await contactService.getAllMessages(filters);
  res.json(data);
};

exports.create = async (req, res) => {
  const created = await contactService.createMessage(req.body);
  res.status(201).json(created);
};

exports.updateHandledStatus = async (req, res) => {
  const { handled } = req.body;

  if (typeof handled !== 'boolean') {
    return res.status(400).json({ error: 'handled חייב להיות boolean' });
  }

  const updated = await contactService.updateHandledStatus(req.params.id, handled);

  if (!updated) {
    return res.status(404).json({ error: 'הודעה לא נמצאה' });
  }

  return res.json(updated);
};
