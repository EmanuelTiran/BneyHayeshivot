const prayerService = require(
  '../services/prayerService'
);

const {
  sendUpdateNewsletter,
} = require('../services/emailService');

const Announcement = require(
  '../models/Announcement'
);

const Prayer = require(
  '../models/Prayer'
);

/*
 * שולח את המייל ברקע.
 *
 * הפונקציה נפרדת מהבקשה הראשית כדי שהמשתמש
 * לא יצטרך להמתין עד ש-Resend יסיים את השליחה.
 */
const sendNewsletterInBackground = async (
  updatedPrayers,
  prayerSectionTitle
) => {
  try {
    console.log(
      '[Newsletter] מתחיל תהליך הכנת המייל...'
    );

    /*
     * בשלב הזה ההודעות כבר נשמרו על ידי
     * ContactAndPrayerTimes.
     */
    const announcements =
      await Announcement.find()
        .sort({ createdAt: -1 })
        .lean();

    console.log(
      '[Newsletter] נמצאו',
      announcements.length,
      'הכרזות'
    );

    console.log(
      '[Newsletter] מספר תפילות:',
      updatedPrayers.length
    );

    console.log(
      '[Newsletter] כותרת התפילות:',
      prayerSectionTitle
    );

    await sendUpdateNewsletter(
      updatedPrayers,
      announcements,
      prayerSectionTitle
    );

    console.log(
      '[Newsletter] תהליך השליחה הסתיים'
    );
  } catch (error) {
    console.error(
      '[Newsletter] שגיאה בתהליך השליחה:',
      error.message
    );
  }
};

exports.getPrayers = async (req, res) => {
  try {
    const [
      prayers,
      prayerSectionTitle,
    ] = await Promise.all([
      prayerService.getAllPrayers(),
      prayerService.getPrayerSectionTitle(),
    ]);

    res.json({
      prayers,
      prayerSectionTitle,
    });
  } catch (error) {
    console.error(
      '[Prayers] שגיאה בקבלת התפילות:',
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};

exports.replacePrayers = async (req, res) => {
  try {
    const {
      prayers,
      prayerSectionTitle,
    } = req.body;

    if (!Array.isArray(prayers)) {
      return res.status(400).json({
        message: 'prayers must be an array',
      });
    }

    /*
     * שמירת התפילות והכותרת במקביל.
     */
    const [
      updatedPrayers,
      titleSetting,
    ] = await Promise.all([
      prayerService.replaceAllPrayers(prayers),

      prayerSectionTitle !== undefined
        ? prayerService.setPrayerSectionTitle(
            prayerSectionTitle
          )
        : Promise.resolve(null),
    ]);

    /*
     * קביעת הכותרת הסופית שתיכנס למייל.
     */
    const finalTitle = titleSetting
      ? titleSetting.value
      : await prayerService.getPrayerSectionTitle();

    /*
     * מחזירים תשובה לממשק מיד לאחר שהשמירה הצליחה.
     */
    res.json({
      prayers: updatedPrayers,
      prayerSectionTitle: finalTitle,
    });

    /*
     * שליחת המייל ברקע.
     *
     * אין כאן await בכוונה, כדי שהממשק לא יצטרך
     * להמתין עד לסיום שליחת כל המיילים.
     */
    void sendNewsletterInBackground(
      updatedPrayers,
      finalTitle
    );
  } catch (error) {
    console.error(
      '[Prayers] שגיאה בשמירת התפילות:',
      error
    );

    /*
     * מונע ניסיון לשלוח תשובה נוספת אם התשובה
     * כבר נשלחה מסיבה בלתי צפויה.
     */
    if (!res.headersSent) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
};

exports.create = async (req, res) => {
  try {
    const savedPrayer =
      await new Prayer(req.body).save();

    res.status(201).json(savedPrayer);
  } catch (error) {
    console.error(
      '[Prayers] שגיאה ביצירת תפילה:',
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};