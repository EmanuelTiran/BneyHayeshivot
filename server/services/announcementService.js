const Announcement = require('../models/Announcement');

exports.getAll = () => Announcement.find();
exports.create = (data) => new Announcement(data).save();


const getAllAnnouncements = () => Announcement.find().sort({ date: -1 });

const createAnnouncement = (data) => Announcement.create(data);

// Update a single announcement by id
const updateAnnouncement = (id, data) =>
  Announcement.findByIdAndUpdate(id, data, { new: true });

const deleteAnnouncement = (id) => Announcement.findByIdAndDelete(id);

module.exports = {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};