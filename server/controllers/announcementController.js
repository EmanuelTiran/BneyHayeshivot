const announcementService = require('../services/announcementService');

exports.getAll = async (req, res) => {
    const data = await announcementService.getAll();
    res.json(data);
};

exports.create = async (req, res) => {
    const created = await announcementService.create(req.body);
    console.log(req.body, "🏆🏆🏆")
    res.status(201).json(created);
};