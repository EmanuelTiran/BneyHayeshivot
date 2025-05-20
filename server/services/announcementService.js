const Announcement = require('../models/Announcement');

exports.getAll = () => Announcement.find();
exports.create = (data) => new Announcement(data).save();
