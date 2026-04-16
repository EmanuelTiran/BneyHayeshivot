const Prayer = require('../models/Prayer');

exports.getAll = () => Prayer.find();
exports.create = (data) => {
    console.log({data})
    new Prayer(data).save()
};

const getAllPrayers = () => Prayer.find();

// Replaces the entire collection with a new array in one transaction
const replaceAllPrayers = async (prayersArray) => {
  await Prayer.deleteMany({});
  return Prayer.insertMany(prayersArray);
};

module.exports = { getAllPrayers, replaceAllPrayers };

// server/services/announcementService.js
// const Announcement = require('../models/Announcement');

// exports.getAll = () => Announcement.find();
// exports.create = (data) => new Announcement(data).save();

// server/services/contactService.js
// const ContactMessage = require('../models/ContactMessage');

// exports.getAll = () => ContactMessage.find();
// exports.create = (data) => new ContactMessage(data).save();

