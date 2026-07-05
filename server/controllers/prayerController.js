const prayerService  = require('../services/prayerService');
const { sendUpdateNewsletter } = require('../services/emailService');
const Announcement   = require('../models/Announcement'); // לשליפת ההכרזות

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

    // ── לוגים לאבחון ──
    console.log('[Newsletter] מתחיל תהליך שליחה...');

    Announcement.find().lean()
      .then(announcements => {
        console.log('[Newsletter] נמצאו', announcements.length, 'הכרזות');
        return sendUpdateNewsletter(updated, announcements, finalTitle);
      })
      .catch(err => console.error('[Newsletter] שגיאה בשליפת הכרזות:', err.message));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const saved = await new (require('../models/Prayer'))(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};