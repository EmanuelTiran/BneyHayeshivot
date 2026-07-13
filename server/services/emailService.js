const { Resend } = require('resend');
const User = require('../models/User');

let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY חסר ב-Environment Variables!');
    }
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// ⚠️ קבוע לחלוטין לאתר הפרודקשן - לעולם לא ל-localhost,
// גם אם ה-Environment Variable מוגדר אחרת בטעות בסביבת הפיתוח.
const SITE_URL = 'https://bneyhayeshivot-1.onrender.com/';

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
                font-family: 'Assistant', Arial, Helvetica, sans-serif;
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
                      font-family: 'Assistant', Arial, Helvetica, sans-serif;
                    ">${a.title || 'הודעת גבאי'}</div>
                    <p style="
                      margin: 8px 0 0;
                      color: #0d2340;
                      font-weight: 500;
                      line-height: 1.6;
                      white-space: pre-wrap;
                      text-align: right;
                      font-size: 14px;
                      font-family: 'Assistant', Arial, Helvetica, sans-serif;
                    ">${a.content}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `).join('')
    : '<p style="color:#888; text-align:right; font-size:14px; font-family:\'Assistant\', Arial, Helvetica, sans-serif;">אין הודעות חדשות</p>';

  const prayersHTML = prayers.map(p => `
    <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin-bottom: 10px;">
      <tr>
        <td style="
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          padding: 12px 16px;
          font-family: 'Assistant', Arial, Helvetica, sans-serif;
        ">
          <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
            <tr>
              <td dir="rtl" style="font-weight: bold; font-size: 16px; color: #1a365d; text-align: right; font-family: 'Assistant', Arial, Helvetica, sans-serif;">
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
                  font-family: 'Assistant', Arial, Helvetica, sans-serif;
                ">${p.time}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  const goldDustDots = [
    { top: '12%', right: '8%', size: 3 },
    { top: '22%', right: '18%', size: 2 },
    { top: '15%', right: '32%', size: 4 },
    { top: '30%', right: '48%', size: 2 },
    { top: '18%', right: '62%', size: 3 },
    { top: '26%', right: '78%', size: 2 },
    { top: '10%', right: '90%', size: 3 },
  ].map(d => `
    <div style="
      position: absolute;
      top: ${d.top};
      right: ${d.right};
      width: ${d.size}px;
      height: ${d.size}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,233,160,.9) 0%, rgba(207,167,86,.5) 60%, transparent 100%);
      box-shadow: 0 0 8px rgba(207,167,86,.8);
    "></div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body dir="rtl" style="margin:0; padding:0; background:#f0ece0; font-family:'Assistant', Arial, Helvetica, sans-serif; direction: rtl; text-align: right;">

      <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"
             style="background:#f0ece0; padding: 32px 16px; direction: rtl; font-family:'Assistant', Arial, Helvetica, sans-serif;">
        <tr><td align="center">

          <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="
            background: #f7f4e9;
            border-radius: 12px;
            border: 1px solid #e3cfa0;
            box-shadow: 0 10px 25px rgba(13, 35, 64, 0.12);
            overflow: hidden;
            max-width: 100%;
            direction: rtl;
            font-family:'Assistant', Arial, Helvetica, sans-serif;
          ">
            <tr>
              <td style="padding: 0;">
                <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="
                  background: linear-gradient(180deg, rgba(18,32,56,1) 0%, rgba(13,35,64,1) 100%);
                ">
                  <tr>
                    <td style="padding: 40px 32px 30px; text-align: center; position: relative;">
                      ${goldDustDots}
                      <div style="position: relative; z-index: 1;">
                        <a href="${SITE_URL}" target="_blank" style="text-decoration: none;">
                          <h1 style="
                            margin: 0;
                            color: #cfa756;
                            font-size: 28px;
                            font-weight: 800;
                            letter-spacing: 0.5px;
                            text-shadow: 0 0 15px rgba(207,167,86,.45), 0 0 35px rgba(207,167,86,.2);
                            font-family:'Assistant', Arial, Helvetica, sans-serif;
                          ">זמני תפילה ומידע</h1>
                        </a>
                        <p style="margin: 10px 0 0; color: rgba(247,244,233,.85); font-size: 14px; letter-spacing: 1px; font-family:'Assistant', Arial, Helvetica, sans-serif;">
                          ${new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <div style="
                          width: 70px;
                          height: 3px;
                          margin: 20px auto 0;
                          border-radius: 5px;
                          background: linear-gradient(90deg,#b8860b,#ffe9a0,#b8860b);
                          box-shadow: 0 0 15px rgba(207,167,86,.8);
                          font-size: 0;
                          line-height: 0;
                        ">&nbsp;</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg,#b8860b,#cfa756,#ffe9a0,#cfa756,#b8860b); font-size:0; line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px 4px; text-align: right;">
                <h2 style="
                  color: #0d2340;
                  font-size: 18px;
                  font-weight: bold;
                  margin: 0 0 4px;
                  text-align: right;
                  font-family:'Assistant', Arial, Helvetica, sans-serif;
                ">הודעות חשובות</h2>
                ${announcementsHTML}
              </td>
            </tr>

            <tr>
              <td style="padding: 12px 32px 4px;">
                <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="
                  background: #ffffff;
                  border: 1px solid #f0f0f0;
                  border-radius: 10px;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                  font-family:'Assistant', Arial, Helvetica, sans-serif;
                ">
                  <tr>
                    <td style="padding: 16px;">
                      <div style="font-size: 17px; font-weight: bold; color: #0d2340; margin-bottom: 6px; font-family:'Assistant', Arial, Helvetica, sans-serif;">
                        📍 כתובתנו:
                      </div>
                      <div style="font-size: 15px; color: #444; font-weight: 500; font-family:'Assistant', Arial, Helvetica, sans-serif;">
                        הרב רפאל ברוך טולדנו 20 | רמת שלמה
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

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
                  font-family:'Assistant', Arial, Helvetica, sans-serif;
                ">${prayerSectionTitle || 'זמני תפילות'}</h2>
                <div>
                  ${prayersHTML}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 4px 32px 24px; text-align: center;">
                <p style="margin:0 0 8px; color:#999; font-size: 11px; font-family:'Assistant', Arial, Helvetica, sans-serif;">
                  קיבלת מייל זה כי הנך רשום/ה כחבר/ת הקהילה.
                </p>
                <a href="${SITE_URL}" target="_blank" style="
                  color: #0d2340;
                  font-size: 12px;
                  font-weight: bold;
                  text-decoration: underline;
                  font-family:'Assistant', Arial, Helvetica, sans-serif;
                ">לצפייה באתר</a>
              </td>
            </tr>
          </table>

        </td></tr>
      </table>
    </body>
    </html>
  `;
};

const sendUpdateNewsletter = async (prayers, announcements, prayerSectionTitle) => {
  try {
    console.log('[Newsletter] מתחיל תהליך שליחה...');
    const resend = getResendClient();
    const users = await User.find(
      {
        isActive: true,
        receivesNewsletter: { $ne: false }, // ← מכבד את סימון הצ'קבוקס
        email: { $exists: true, $ne: '' }
      },
      'email name'
    ).lean();

    console.log(`[Newsletter] נמצאו ${users.length} משתמשים`);

    if (!users.length) {
      console.log('[Newsletter] אין משתמשים לשליחה');
      return;
    }

    const emails = users.map(u => u.email);
    const html = buildNewsletterHTML(prayers, announcements, prayerSectionTitle);

    console.log('[Newsletter] שולח מייל דרך Resend...');

    const { data, error } = await resend.emails.send({
      from: 'בית הכנסת <updates@bneyhayeshivot.online>',
      to: process.env.EMAIL_USER,
      bcc: emails,
      subject: `📋 עדכון זמני תפילה והודעות — ${new Date().toLocaleDateString('he-IL')}`,
      html,
    });

    if (error) {
      console.error('[Newsletter] ✗✗✗ שגיאה מ-Resend:', error);
      return;
    }

    console.log(`[Newsletter] ✓✓✓ נשלח בהצלחה! id: ${data.id}`);

  } catch (err) {
    console.error('[Newsletter] ✗✗✗ שגיאה כללית:', err);
  }
};

module.exports = { sendUpdateNewsletter };