const { Resend } = require('resend');
const User = require('../models/User');
const numberToHebrewLetters = (number) => {
  number %= 1000;

  const values = [
    [400, 'ת'],
    [300, 'ש'],
    [200, 'ר'],
    [100, 'ק'],
    [90, 'צ'],
    [80, 'פ'],
    [70, 'ע'],
    [60, 'ס'],
    [50, 'נ'],
    [40, 'מ'],
    [30, 'ל'],
    [20, 'כ'],
    [10, 'י'],
    [9, 'ט'],
    [8, 'ח'],
    [7, 'ז'],
    [6, 'ו'],
    [5, 'ה'],
    [4, 'ד'],
    [3, 'ג'],
    [2, 'ב'],
    [1, 'א'],
  ];

  let result = '';

  for (const [value, letter] of values) {
    if (number === 15) {
      result += 'טו';
      break;
    }

    if (number === 16) {
      result += 'טז';
      break;
    }

    while (number >= value) {
      result += letter;
      number -= value;
    }
  }

  if (result.length === 1) {
    return `${result}'`;
  }

  return `${result.slice(0, -1)}"${result.slice(-1)}`;
};

const getShortHebrewDate = () => {
  const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatter
    .formatToParts(new Date())
    .map((part) => {
      if (part.type === 'day') {
        return numberToHebrewLetters(Number(part.value));
      }

      if (part.type === 'year') {
        return `ה${numberToHebrewLetters(Number(part.value))}`;
      }

      return part.value;
    })
    .join('');
};
let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY חסר ב-Environment Variables!');
    }

    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
};

// כתובת אתר הפרודקשן בלבד — לעולם לא localhost.
const SITE_URL = 'https://bneyhayeshivot-1.onrender.com/';
const COMMUNITY_NAME = 'בני הישיבות רמת שלמה';

const escapeHTML = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });

const formatMultilineText = (value = '') =>
  escapeHTML(value).replace(/\r?\n/g, '<br>');

const formatHebrewDate = () =>
  new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const buildGoldDotsHTML = () => {
  const dots = [5, 3, 7, 4, 6, 3, 5, 4, 7, 3, 6];

  return dots
    .map(
      (size, index) => `
        <td
          align="center"
          valign="middle"
          style="padding: 0 ${index % 2 === 0 ? 5 : 7}px;"
        >
          <span
            class="gold-dot gold-dot-${(index % 4) + 1}"
            style="
              display: inline-block;
              width: ${size}px;
              height: ${size}px;
              border-radius: 999px;
              background-color: #cfa756;
              box-shadow: 0 0 8px rgba(255, 224, 132, 0.75);
              opacity: ${index % 3 === 0 ? '0.95' : '0.58'};
              font-size: 0;
              line-height: 0;
            "
          >&nbsp;</span>
        </td>
      `
    )
    .join('');
};

const buildAnnouncementsHTML = (announcements = []) => {
  if (!announcements.length) {
    return `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        dir="rtl"
      >
        <tr>
          <td style="
            padding: 16px 18px;
            background-color: #fffdf7;
            border: 1px solid #eadbb8;
            border-radius: 12px;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.7;
            text-align: right;
          ">
            אין הודעות חדשות לעת עתה.
          </td>
        </tr>
      </table>
    `;
  }

  return announcements
    .map(
      (announcement) => `
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          dir="rtl"
          style="margin: 0 0 14px;"
        >
          <tr>
            <td style="
              background-color: #ffffff;
              border: 1px solid #eadbb8;
              border-right: 4px solid #a61b1b;
              border-radius: 12px;
              box-shadow: 0 5px 14px rgba(13, 35, 64, 0.07);
              overflow: hidden;
              text-align: right;
            ">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                dir="rtl"
              >
                <tr>
                  <td style="
                    padding: 14px 16px 7px;
                    text-align: right;
                  ">
                    <span style="
                      display: inline-block;
                      padding: 5px 11px;
                      background-color: #a61b1b;
                      border-radius: 999px;
                      color: #ffffff;
                      font-size: 12px;
                      font-weight: 700;
                      line-height: 1.3;
                    ">
                      ${escapeHTML(
                        announcement.title || 'הודעת גבאי'
                      )}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding: 4px 16px 16px;
                    color: #0d2340;
                    font-size: 15px;
                    font-weight: 500;
                    line-height: 1.75;
                    text-align: right;
                  ">
                    ${formatMultilineText(
                      announcement.content || ''
                    )}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    )
    .join('');
};

const buildPrayersHTML = (prayers = []) => {
  if (!prayers.length) {
    return `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        dir="rtl"
      >
        <tr>
          <td style="
            padding: 16px 18px;
            background-color: #ffffff;
            border: 1px solid #eadbb8;
            border-radius: 12px;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.7;
            text-align: right;
          ">
            זמני התפילות יעודכנו בקרוב.
          </td>
        </tr>
      </table>
    `;
  }

  return prayers
    .map(
      (prayer) => `
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          dir="rtl"
          style="margin: 0 0 11px;"
        >
          <tr>
            <td style="
              padding: 13px 15px;
              background-color: #ffffff;
              border: 1px solid #eadbb8;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(13, 35, 64, 0.06);
            ">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                dir="rtl"
              >
                <tr>
                  <td
                    class="prayer-name-cell"
                    valign="middle"
                    style="
                      color: #1a365d;
                      font-size: 16px;
                      font-weight: 700;
                      line-height: 1.5;
                      text-align: right;
                    "
                  >
                    ${escapeHTML(
                      prayer.title ?? prayer.name ?? ''
                    )}
                  </td>

                  <td
                    class="prayer-time-cell"
                    width="125"
                    valign="middle"
                    align="left"
                    style="text-align: left;"
                  >
                    <span
                      class="prayer-time"
                      dir="ltr"
                      style="
                        display: inline-block;
                        min-width: 72px;
                        padding: 7px 15px;
                        background-color: #162641;
                        border: 1px solid rgba(207, 167, 86, 0.55);
                        border-radius: 999px;
                        box-shadow: inset 0 0 12px rgba(207, 167, 86, 0.08);
                        color: #e2bd6d;
                        font-size: 15px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        line-height: 1.2;
                        text-align: center;
                      "
                    >
                      ${escapeHTML(prayer.time || '')}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    )
    .join('');
};

const buildNewsletterHTML = (
  prayers = [],
  announcements = [],
  prayerSectionTitle = 'זמני תפילות'
) => {
  const currentDate = formatHebrewDate();

  const announcementsHTML =
    buildAnnouncementsHTML(announcements);

  const prayersHTML = buildPrayersHTML(prayers);
  const goldDotsHTML = buildGoldDotsHTML();

  return `
    <!doctype html>

    <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <meta
          name="x-apple-disable-message-reformatting"
        >

        <meta
          name="format-detection"
          content="telephone=no,date=no,address=no,email=no,url=no"
        >

        <title>${COMMUNITY_NAME}</title>

        <style>
          html,
          body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          table,
          td {
            border-collapse: separate;
          }

          img {
            display: block;
            max-width: 100%;
            height: auto;
            border: 0;
          }

          a {
            color: inherit;
          }

          a[x-apple-data-detectors],
          u + #email-body a,
          #MessageViewBody a {
            color: inherit !important;
            font: inherit !important;
            text-decoration: none !important;
          }

          /*
           * ברירת המחדל היא עיצוב סטטי.
           * כך לקוחות מייל שלא תומכים באנימציות
           * מציגים את המייל בצורה תקינה.
           */
          .gold-dot,
          .royal-sweep {
            animation: none;
          }

          @keyframes goldTwinkle {
            0%,
            100% {
              opacity: 0.35;
              transform: scale(0.78);
            }

            50% {
              opacity: 1;
              transform: scale(1.25);
            }
          }

          @keyframes royalSweep {
            0% {
              background-position: 180% 0;
            }

            100% {
              background-position: -180% 0;
            }
          }

          /*
           * האנימציה תופעל רק בלקוחות מייל
           * שמצהירים על תמיכה באנימציות CSS.
           */
          @media screen {
            @supports (animation-name: goldTwinkle) {
              .gold-dot {
                animation:
                  goldTwinkle
                  3.6s
                  ease-in-out
                  infinite;
              }

              .gold-dot-2 {
                animation-delay: -0.8s;
              }

              .gold-dot-3 {
                animation-delay: -1.6s;
              }

              .gold-dot-4 {
                animation-delay: -2.4s;
              }

              .royal-sweep {
                animation:
                  royalSweep
                  5s
                  linear
                  infinite;
              }
            }
          }

          /*
           * התאמה למובייל.
           */
          @media only screen and (max-width: 620px) {
            .outer-cell {
              padding: 12px 8px !important;
            }

            .email-card {
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 14px !important;
            }

            .header-cell {
              padding:
                30px
                18px
                25px !important;
            }

            .brand-title {
              font-size: 27px !important;
              line-height: 1.2 !important;
            }

            .brand-subtitle {
              font-size: 15px !important;
            }

            .section-cell {
              padding-right: 16px !important;
              padding-left: 16px !important;
            }

            .section-title {
              font-size: 19px !important;
            }

            .footer-cell {
              padding-right: 18px !important;
              padding-left: 18px !important;
            }
          }

          /*
           * במסכים צרים במיוחד שם התפילה
           * והשעה יוצגו בשתי שורות.
           */
          @media only screen and (max-width: 430px) {
            .prayer-name-cell,
            .prayer-time-cell {
              display: block !important;
              width: 100% !important;
              text-align: right !important;
            }

            .prayer-time-cell {
              padding-top: 9px !important;
            }

            .prayer-time {
              min-width: 66px !important;
              padding: 6px 13px !important;
            }
          }

          /*
           * מכבד משתמשים שביקשו להפחית הנפשות.
           */
          @media (prefers-reduced-motion: reduce) {
            .gold-dot,
            .royal-sweep {
              animation: none !important;
            }
          }
        </style>

        <!--[if mso]>
          <style>
            .email-card {
              width: 620px !important;
            }

            .gold-dot,
            .royal-sweep {
              animation: none !important;
            }
          </style>
        <![endif]-->
      </head>

      <body
        id="email-body"
        dir="rtl"
        style="
          width: 100%;
          margin: 0;
          padding: 0;
          background-color: #eee9dc;
          color: #0d2340;
          direction: rtl;
          text-align: right;
          font-family:
            Assistant,
            Arial,
            Helvetica,
            sans-serif;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        "
      >
        <!-- טקסט מקדים שמופיע בתצוגה המקדימה של תיבת המייל -->
        <div
          style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            color: transparent;
            mso-hide: all;
          "
        >
          עדכוני הקהילה, הודעות וזמני תפילה מאת
          ${COMMUNITY_NAME}.
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          dir="rtl"
          bgcolor="#eee9dc"
          style="
            width: 100%;
            background-color: #eee9dc;
          "
        >
          <tr>
            <td
              class="outer-cell"
              align="center"
              style="padding: 34px 14px;"
            >
              <!--[if mso]>
                <table
                  role="presentation"
                  width="620"
                  cellpadding="0"
                  cellspacing="0"
                  align="center"
                >
                  <tr>
                    <td>
              <![endif]-->

              <table
                role="presentation"
                class="email-card"
                width="620"
                cellpadding="0"
                cellspacing="0"
                dir="rtl"
                style="
                  width: 100%;
                  max-width: 620px;
                  background-color: #f7f4e9;
                  border: 1px solid #dfc88f;
                  border-radius: 18px;
                  box-shadow:
                    0 16px 42px
                    rgba(13, 35, 64, 0.16);
                  overflow: hidden;
                "
              >
                <!-- פס זהב מונפש -->
                <tr>
                  <td
                    class="royal-sweep"
                    height="5"
                    bgcolor="#cfa756"
                    style="
                      height: 5px;
                      background-color: #cfa756;
                      background-image:
                        linear-gradient(
                          90deg,
                          #0d2340 0%,
                          #b8860b 22%,
                          #ffe9a0 50%,
                          #b8860b 78%,
                          #0d2340 100%
                        );
                      background-size: 220% 100%;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <!-- כותרת עליונה -->
                <tr>
                  <td
                    class="header-cell"
                    align="center"
                    bgcolor="#0d2340"
                    style="
                      padding: 38px 30px 30px;
                      background-color: #0d2340;
                      background-image:
                        linear-gradient(
                          160deg,
                          #182f50 0%,
                          #0d2340 54%,
                          #09182d 100%
                        );
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 7px;
                        color: #f7f4e9;
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 2px;
                        line-height: 1.4;
                        opacity: 0.82;
                      "
                    >
                      קהילת
                    </p>

                    <h1
                      class="brand-title"
                      style="
                        margin: 0;
                        color: #e0b75f;
                        font-size: 33px;
                        font-weight: 800;
                        letter-spacing: 0.2px;
                        line-height: 1.2;
                        text-shadow:
                          0 0 18px
                          rgba(207, 167, 86, 0.4);
                      "
                    >
                      ${COMMUNITY_NAME}
                    </h1>

                    <p
                      class="brand-subtitle"
                      style="
                        margin: 10px 0 0;
                        color: #f7f4e9;
                        font-size: 16px;
                        font-weight: 500;
                        line-height: 1.5;
                        opacity: 0.93;
                      "
                    >
                      זמני תפילה, הודעות ומידע
                    </p>

                    <!-- נקודות הזהב -->
                    <table
                      role="presentation"
                      width="205"
                      cellpadding="0"
                      cellspacing="0"
                      align="center"
                      style="margin: 20px auto 16px;"
                    >
                      <tr aria-hidden="true">
                        ${goldDotsHTML}
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 0;
                        color: #d7cfbd;
                        font-size: 13px;
                        font-weight: 400;
                        line-height: 1.5;
                      "
                    >
                      ${getShortHebrewDate()}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    height="2"
                    bgcolor="#cfa756"
                    style="
                      height: 2px;
                      background-color: #cfa756;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <!-- הודעות חשובות -->
                <tr>
                  <td
                    class="section-cell"
                    style="
                      padding: 27px 30px 5px;
                      text-align: right;
                    "
                  >
                    <h2
                      class="section-title"
                      style="
                        margin: 0 0 15px;
                        color: #0d2340;
                        font-size: 21px;
                        font-weight: 800;
                        line-height: 1.4;
                        text-align: right;
                      "
                    >
                      הודעות חשובות
                    </h2>

                    ${announcementsHTML}
                  </td>
                </tr>

                <!-- כתובת -->
                <tr>
                  <td
                    class="section-cell"
                    style="padding: 12px 30px 5px;"
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      dir="rtl"
                    >
                      <tr>
                        <td
                          style="
                            padding: 17px 18px;
                            background-color: #fffdf7;
                            border: 1px solid #dfc88f;
                            border-radius: 12px;
                            box-shadow:
                              0 5px 14px
                              rgba(13, 35, 64, 0.06);
                            text-align: right;
                          "
                        >
                          <p
                            style="
                              margin: 0 0 5px;
                              color: #0d2340;
                              font-size: 17px;
                              font-weight: 800;
                              line-height: 1.4;
                            "
                          >
                            <span style="color: #c1973d;">
                              ●
                            </span>
                            &nbsp; כתובתנו
                          </p>

                          <p
                            style="
                              margin: 0;
                              color: #4b5563;
                              font-size: 15px;
                              font-weight: 500;
                              line-height: 1.65;
                            "
                          >
                            הרב רפאל ברוך טולדנו 20 |
                            רמת שלמה
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- זמני תפילות -->
                <tr>
                  <td
                    class="section-cell"
                    style="
                      padding: 24px 30px 12px;
                      text-align: right;
                    "
                  >
                    <h2
                      class="section-title"
                      style="
                        display: inline-block;
                        margin: 0 0 16px;
                        padding: 0 0 7px;
                        border-bottom:
                          2px solid #cfa756;
                        color: #0d2340;
                        font-size: 21px;
                        font-weight: 800;
                        line-height: 1.4;
                        text-align: right;
                      "
                    >
                      ${escapeHTML(
                        prayerSectionTitle ||
                          'זמני תפילות'
                      )}
                    </h2>

                    ${prayersHTML}
                  </td>
                </tr>

                <!-- כפתור כניסה לאתר -->
                <tr>
                  <td
                    class="section-cell"
                    align="center"
                    style="
                      padding: 11px 30px 28px;
                      text-align: center;
                    "
                  >
                    <table
                      role="presentation"
                      cellpadding="0"
                      cellspacing="0"
                      align="center"
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#0d2340"
                          style="
                            border:
                              1px solid #cfa756;
                            border-radius: 999px;
                          "
                        >
                          <a
                            href="${SITE_URL}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 12px 26px;
                              border-radius: 999px;
                              color: #e1bb69;
                              font-size: 15px;
                              font-weight: 800;
                              line-height: 1.2;
                              text-align: center;
                              text-decoration: none;
                            "
                          >
                            כניסה לאתר הקהילה
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- חלק תחתון -->
                <tr>
                  <td
                    class="footer-cell"
                    align="center"
                    bgcolor="#ede5d2"
                    style="
                      padding: 19px 30px 22px;
                      background-color: #ede5d2;
                      border-top:
                        1px solid #dfc88f;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 6px;
                        color: #6b6255;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      קיבלת מייל זה משום שהנך
                      רשום/ה כחבר/ת הקהילה.
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #0d2340;
                        font-size: 12px;
                        font-weight: 800;
                        line-height: 1.5;
                      "
                    >
                      ${COMMUNITY_NAME}
                    </p>
                  </td>
                </tr>
              </table>

              <!--[if mso]>
                    </td>
                  </tr>
                </table>
              <![endif]-->
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const buildNewsletterText = (
  prayers = [],
  announcements = [],
  prayerSectionTitle = 'זמני תפילות'
) => {
  const announcementLines = announcements.length
    ? announcements
        .map(
          (announcement) =>
            `${
              announcement.title || 'הודעת גבאי'
            }\n${announcement.content || ''}`
        )
        .join('\n\n')
    : 'אין הודעות חדשות לעת עתה.';

  const prayerLines = prayers.length
    ? prayers
        .map(
          (prayer) =>
            `${
              prayer.title ?? prayer.name ?? ''
            }: ${prayer.time || ''}`
        )
        .join('\n')
    : 'זמני התפילות יעודכנו בקרוב.';

  return [
    COMMUNITY_NAME,
    'זמני תפילה, הודעות ומידע',
    formatHebrewDate(),
    '',
    'הודעות חשובות',
    announcementLines,
    '',
    'כתובתנו',
    'הרב רפאל ברוך טולדנו 20 | רמת שלמה',
    '',
    prayerSectionTitle || 'זמני תפילות',
    prayerLines,
    '',
    `לאתר הקהילה: ${SITE_URL}`,
  ].join('\n');
};

const sendUpdateNewsletter = async (
  prayers,
  announcements,
  prayerSectionTitle
) => {
  try {
    console.log(
      '[Newsletter] מתחיל תהליך שליחה...'
    );

    const resend = getResendClient();

    const users = await User.find(
      {
        isActive: true,

        // מכבד את בחירת המשתמש
        // אם לקבל את עדכוני הקהילה.
        receivesNewsletter: {
          $ne: false,
        },

        email: {
          $exists: true,
          $ne: '',
        },
      },
      'email name'
    ).lean();

    console.log(
      `[Newsletter] נמצאו ${users.length} משתמשים`
    );

    if (!users.length) {
      console.log(
        '[Newsletter] אין משתמשים לשליחה'
      );

      return;
    }

    /*
     * הסרת כתובות כפולות וריקות.
     */
    const emails = [
      ...new Set(
        users
          .map((user) => user.email.trim())
          .filter(Boolean)
      ),
    ];

    const html = buildNewsletterHTML(
      prayers,
      announcements,
      prayerSectionTitle
    );

    /*
     * גרסת טקסט חלופית ללקוחות מייל
     * שאינם תומכים ב-HTML.
     */
    const text = buildNewsletterText(
      prayers,
      announcements,
      prayerSectionTitle
    );

    const numberToHebrewLetters = (number) => {
      number %= 1000;
    
      const values = [
        [400, 'ת'],
        [300, 'ש'],
        [200, 'ר'],
        [100, 'ק'],
        [90, 'צ'],
        [80, 'פ'],
        [70, 'ע'],
        [60, 'ס'],
        [50, 'נ'],
        [40, 'מ'],
        [30, 'ל'],
        [20, 'כ'],
        [10, 'י'],
        [9, 'ט'],
        [8, 'ח'],
        [7, 'ז'],
        [6, 'ו'],
        [5, 'ה'],
        [4, 'ד'],
        [3, 'ג'],
        [2, 'ב'],
        [1, 'א'],
      ];
    
      let result = '';
    
      for (const [value, letter] of values) {
        // טיפול מיוחד במספרים ט״ו וט״ז
        if (number === 15) {
          result += 'טו';
          number = 0;
          break;
        }
    
        if (number === 16) {
          result += 'טז';
          number = 0;
          break;
        }
    
        while (number >= value) {
          result += letter;
          number -= value;
        }
      }
    
      if (result.length === 1) {
        return `${result}'`;
      }
    
      return `${result.slice(0, -1)}"${result.slice(-1)}`;
    };
    
    const dateFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      timeZone: 'Asia/Jerusalem',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    
    const shortDate = dateFormatter
    .formatToParts(new Date())
    .map((part) => {
      if (part.type === 'day') {
        return numberToHebrewLetters(Number(part.value));
      }
  
      if (part.type === 'year') {
        return `ה${numberToHebrewLetters(Number(part.value))}`;
      }
  
      return part.value;
    })
    .join('');   

    console.log(
      '[Newsletter] שולח מייל דרך Resend...'
    );

    const { data, error } =
      await resend.emails.send({
        /*
         * זהו השם שהמשתמש יראה
         * בתור שולח המייל.
         */
        from:
          `${COMMUNITY_NAME} ` +
          '<updates@bneyhayeshivot.online>',

        /*
         * כתובת ראשית פנימית.
         */
        to: process.env.EMAIL_USER,

        /*
         * חברי הקהילה לא יוכלו לראות
         * את כתובות המייל זה של זה.
         */
        bcc: emails,

        /*
         * כותרת המייל בתיבת הדואר.
         */
        subject:
          `${COMMUNITY_NAME} | ` +
          `עדכונים וזמני תפילה | ` +
          shortDate,

        html,
        text,
      });

    if (error) {
      console.error(
        '[Newsletter] ✗✗✗ שגיאה מ-Resend:',
        error
      );

      return;
    }

    console.log(
      `[Newsletter] ✓✓✓ נשלח בהצלחה! id: ${data.id}`
    );
  } catch (error) {
    console.error(
      '[Newsletter] ✗✗✗ שגיאה כללית:',
      error
    );
  }
};

module.exports = {
  sendUpdateNewsletter,
};