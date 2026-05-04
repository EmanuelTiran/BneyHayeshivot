const prayerService = require('../services/prayerService');

// שליפת כל התפילות + כותרת הסקשן
exports.getPrayers = async (req, res) => {
  try {
    const [prayers, prayerSectionTitle] = await Promise.all([
      prayerService.getAllPrayers(),
      prayerService.getPrayerSectionTitle(),
    ]);
    res.json({ prayers, prayerSectionTitle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// עדכון כל רשימת התפילות + כותרת (אדמין בלבד)
exports.replacePrayers = async (req, res) => {
  try {
    const { prayers, prayerSectionTitle } = req.body;

    if (!Array.isArray(prayers)) {
      return res.status(400).json({ message: 'prayers must be an array' });
    }

    const [updated, titleSetting] = await Promise.all([
      prayerService.replaceAllPrayers(prayers),
      prayerSectionTitle !== undefined
        ? prayerService.setPrayerSectionTitle(prayerSectionTitle)
        : Promise.resolve(null),
    ]);

    const finalTitle = titleSetting
      ? titleSetting.value
      : await prayerService.getPrayerSectionTitle();

    res.json({ prayers: updated, prayerSectionTitle: finalTitle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// יצירת תפילה בודדת
exports.create = async (req, res) => {
  try {
    const saved = await new (require('../models/Prayer'))(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};