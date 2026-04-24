const SponsorshipRequest = require('../models/SponsorshipRequest');
const nodemailer         = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const create = async (data, itemTitle, categoryName) => {
  const request = await SponsorshipRequest.create(data);

  const mailOptions = {
    from:    process.env.EMAIL_USER,
    to:      process.env.ADMIN_EMAIL,
    subject: `🕍 בקשת הנצחה חדשה — ${categoryName} | ${itemTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
           border: 2px solid #cfa756; border-radius: 8px; padding: 24px; background: #f7f4e9;">
        <h2 style="color: #0d2340; border-bottom: 2px solid #cfa756; padding-bottom: 8px;">
          בקשת הנצחה חדשה
        </h2>
        <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">שם:</td><td>${data.name}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">טלפון:</td><td>${data.phone}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">אימייל:</td><td>${data.email}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">קטגוריה:</td><td>${categoryName}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">פריט:</td><td>${itemTitle}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">סוג הנצחה:</td><td>${data.dedicationType}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">שם להנצחה:</td><td>${data.dedicationName || '—'}</td></tr>
          <tr><td style="padding:6px; font-weight:bold; color:#0d2340;">הערה לגבאי:</td><td>${data.adminNote || '—'}</td></tr>
        </table>
        <p style="margin-top:16px; color:#666; font-size:12px;">
          נשלח מהאתר — ${new Date().toLocaleString('he-IL')}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (emailErr) {
    console.error('שגיאה בשליחת אימייל:', emailErr.message);
  }

  return request;
};

const getAll       = ()           => SponsorshipRequest.find().populate('itemId categoryId').sort({ createdAt: -1 });
const updateStatus = (id, status) => SponsorshipRequest.findByIdAndUpdate(id, { status }, { new: true });

module.exports = { create, getAll, updateStatus };