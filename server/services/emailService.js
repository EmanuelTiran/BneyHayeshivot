const nodemailer = require('nodemailer');
const User       = require('../models/User');

const SITE_URL = 'https://bneyhayeshivot-1.onrender.com/';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * בונה את תוכן ה-HTML למייל
 * העיצוב מותאם 1:1 לקומפוננטת ContactAndPrayerTimes:
 * - כרטיס ראשי בז' (#f7f4e9) עם מסגרת זהב עדינה ופס גרדיאנט עליון
 * - הודעות גבאי: כרטיס לבן עם פס אדום מימין + "תגית" אדומה צפה
 * - כרטיס כתובת לבן נפרד עם 📍
 * - זמני תפילה: כרטיסי "כדור" – שם התפילה כהה, השעה בכפתור זהב-על-כחול
 */
const buildNewsletterHTML = (prayers, announcements, prayerSectionTitle) => {
  const announcementsHTML = announcements.length
    ? announcements.map(a => `
        <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin-bottom: 14px;">
          <tr>
            <td style="padding-top: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="
                background: #ffffff;
                border-right: 4px solid #a61b1b;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              ">
                <tr>
                  <td style="padding: 16px 16px 14px;">
                    <div style="
                      display: inline-block;
                      background: #a61b1b;
                      color: #ffffff;
                      font-size: 12px;
                      font-weight: bold;
                      padding: 4px 12px;
                      border-radius: 4px;
                      margin-top: -26px;
                      margin-bottom: 8px;
                      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
                    ">${a.title || 'הודעת גבאי'}</div>
                    <p style="
                      margin: 8px 0 0;
                      color: #0d2340;
                      font-weight: 500;
                      line-height: 1.6;
                      white-space: pre-wrap;
                      text-align: right;
                      font-size: 14px;
                    ">${a.content}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `).join('')
    : '<p style="color:#888; text-align:right; font-size:14px;">אין הודעות חדשות</p>';

  const prayersHTML = prayers.map(p => `
    <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin-bottom: 10px;">
      <tr>
        <td style="
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          padding: 12px 16px;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
            <tr>
              <td dir="rtl" style="font-weight: bold; font-size: 16px; color: #1a365d; text-align: right;">
                ${p.title ?? p.name}
              </td>
              <td style="text-align: left;">
                <span style="
                  background: #162641;
                  color: #cfa756;
                  font-weight: bold;
                  padding: 5px 16px;
                  border-radius: 999px;
                  font-size: 15px;
                  letter-spacing: 1px;
                  display: inline-block;
                ">${p.time}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body dir="rtl" style="margin:0; padding:0; background:#f0ece0; font-family: Arial, sans-serif; direction: rtl; text-align: right;">

      <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"
             style="background:#f0ece0; padding: 32px 16px; direction: rtl;">
        <tr><td align="center">

          <!-- כרטיס ראשי (בז' כמו בקומפוננטה) -->
          <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="
            background: #f7f4e9;
            border-radius: 12px;
            border: 1px solid #e3cfa0;
            box-shadow: 0 10px 25px rgba(13, 35, 64, 0.12);
            overflow: hidden;
            max-width: 100%;
            direction: rtl;
          ">
            <!-- פס עליון -->
            <tr>
              <td style="
                background: linear-gradient(to left, #0d2340, #cfa756, #0d2340);
                height: 6px;
              "></td>
            </tr>

            <!-- כותרת + תאריך -->
            <tr>
              <td style="padding: 28px 32px 12px; text-align: center;">
                <a href="${SITE_URL}" target="_blank" style="text-decoration: none;">
                  <h1 style="
                    margin: 0;
                    color: #0d2340;
                    font-size: 24px;
                    font-weight: bold;
                  ">זמני תפילה ומידע</h1>
                </a>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">
                  ${new Date().toLocaleDateString('he-IL', {
                    weekday: 'long', year: 'numeric',
                    month: 'long',   day: 'numeric'
                  })}
                </p>
              </td>
            </tr>

            <!-- הודעות גבאי -->
            <tr>
              <td style="padding: 12px 32px 4px; text-align: right;">
                <h2 style="
                  color: #0d2340;
                  font-size: 18px;
                  font-weight: bold;
                  margin: 0 0 4px;
                  text-align: right;
                ">הודעות חשובות</h2>
                ${announcementsHTML}
              </td>
            </tr>

            <!-- כתובת (כרטיס לבן נפרד, כמו בקומפוננטה) -->
            <tr>
              <td style="padding: 12px 32px 4px;">
                <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="
                  background: #ffffff;
                  border: 1px solid #f0f0f0;
                  border-radius: 10px;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                ">
                  <tr>
                    <td style="padding: 16px;">
                      <div style="font-size: 17px; font-weight: bold; color: #0d2340; margin-bottom: 6px;">
                        📍 כתובתנו:
                      </div>
                      <div style="font-size: 15px; color: #444; font-weight: 500;">
                        הרב רפאל ברוך טולדנו 20 | רמת שלמה
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- זמני תפילה -->
            <tr>
              <td style="padding: 20px 32px 30px; text-align: right;">
                <h2 style="
                  color: #0d2340;
                  font-size: 18px;
                  font-weight: bold;
                  margin: 0 0 14px;
                  padding-bottom: 8px;
                  border-bottom: 2px solid #cfa756;
                  display: inline-block;
                ">${prayerSectionTitle || 'זמני תפילות'}</h2>
                <div>
                  ${prayersHTML}
                </div>
              </td>
            </tr>

            <!-- הערת שוליים -->
            <tr>
              <td style="padding: 4px 32px 24px; text-align: center;">
                <p style="margin:0; color:#999; font-size: 11px;">
                  קיבלת מייל זה כי הנך רשום/ה כחבר/ת הקהילה.
                </p>
              </td>
            </tr>
          </table>

        </td></tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * שולח ניוזלטר לכל חברי הקהילה — אסינכרוני לחלוטין (fire & forget)
 * @param {Array} prayers         — רשימת התפילות המעודכנת
 * @param {Array} announcements   — רשימת ההכרזות המעודכנת
 * @param {string} prayerSectionTitle — כותרת סקשן התפילות
 */
const sendUpdateNewsletter = async (prayers, announcements, prayerSectionTitle) => {
    console.log('[Newsletter] === התחלה ===');
    try {
      const users = await User.find(
        { isActive: true, email: { $exists: true, $ne: '' } },
        'email name'
      ).lean();

      console.log('[Newsletter] נמצאו', users.length, 'משתמשים:', users.map(u => u.email));

      if (!users.length) {
        console.log('[Newsletter] ⚠️ אין משתמשים לשליחה — כאן הבעיה!');
        return;
      }

    const emails = users.map(u => u.email);
    const html   = buildNewsletterHTML(prayers, announcements, prayerSectionTitle);

    // BCC — כל הנמענים מקבלים מייל אחד, ללא חשיפת כתובות אחד לשני
    const mailOptions = {
      from:    `"בני הישיבות" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_USER,   // שולח לעצמו (נדרש שדה to תקין)
      bcc:     emails.join(','),
      subject: `📋 עדכון זמני תפילה והודעות — ${new Date().toLocaleDateString('he-IL')}`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Newsletter] ✓ נשלח ל-${emails.length} משתמשים | messageId: ${info.messageId}`);

  } catch (err) {
    // שגיאה בשליחת מיילים לא תפיל את השרת
    console.error('[Newsletter] ✗ שגיאה:', err.message);
  }
};

module.exports = { sendUpdateNewsletter };