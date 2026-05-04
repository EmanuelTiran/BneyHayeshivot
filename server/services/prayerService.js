const Prayer = require('../models/Prayer');
const SiteSettings = require('../models/SiteSettings');

const DEFAULT_PRAYER_TITLE = 'זמני תפילות:';

const getAllPrayers = () => Prayer.find();

const replaceAllPrayers = async (prayersArray) => {
  await Prayer.deleteMany({});
  return Prayer.insertMany(prayersArray);
};

const getPrayerSectionTitle = async () => {
  const setting = await SiteSettings.findOne({ key: 'prayerSectionTitle' });
  return setting ? setting.value : DEFAULT_PRAYER_TITLE;
};

const setPrayerSectionTitle = async (title) => {
  return SiteSettings.findOneAndUpdate(
    { key: 'prayerSectionTitle' },
    { key: 'prayerSectionTitle', value: title },
    { upsert: true, new: true }
  );
};

module.exports = {
  getAllPrayers,
  replaceAllPrayers,
  getPrayerSectionTitle,
  setPrayerSectionTitle,
};