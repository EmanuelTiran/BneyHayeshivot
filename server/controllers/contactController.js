const contactService = require('../services/contactService');

exports.getAll = async (req, res) => {
  const data = await contactService.getAllMessages();
  res.json(data);
};

exports.create = async (req, res) => {
  const created = await contactService.createMessage(req.body);
  res.status(201).json(created);
};
