const Prayer = require('../models/Prayer');

exports.getAll = () => Prayer.find();
exports.create = (data) => new Prayer(data).save();

// server/services/announcementService.js
const Announcement = require('../models/Announcement');

exports.getAll = () => Announcement.find();
exports.create = (data) => new Announcement(data).save();

// server/services/contactService.js
const ContactMessage = require('../models/ContactMessage');

exports.getAll = () => ContactMessage.find();
exports.create = (data) => new ContactMessage(data).save();