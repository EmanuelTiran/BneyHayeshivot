const ContactMessage = require('../models/ContactMessage');

/**
 * יוצר הודעת צור קשר חדשה במסד הנתונים
 * @param {Object} data - אובייקט שכולל name, email, message
 * @returns {Promise<Object>} - ההודעה החדשה שנשמרה
 */
exports.createMessage = async (data) => {
  const contactMessage = new ContactMessage(data);
  return await contactMessage.save();
};

/**
 * מחזיר את כל הודעות צור קשר - לשימוש גבאים
 * @returns {Promise<Array>} - רשימת ההודעות בסדר כרונולוגי יורד
 */
exports.getAllMessages = async () => {
  return await ContactMessage.find().sort({ createdAt: -1 });
};

/**
 * מוחק הודעת צור קשר לפי מזהה
 * @param {string} id - מזהה ההודעה למחיקה
 * @returns {Promise<Object|null>} - ההודעה שנמחקה או null אם לא נמצאה
 */
exports.deleteMessageById = async (id) => {
  return await ContactMessage.findByIdAndDelete(id);
};
