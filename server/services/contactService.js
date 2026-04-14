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
exports.getAllMessages = async (filters = {}) => {
  return await ContactMessage.find(filters).sort({ date: -1 });
};

/**
 * מוחק הודעת צור קשר לפי מזהה
 * @param {string} id - מזהה ההודעה למחיקה
 * @returns {Promise<Object|null>} - ההודעה שנמחקה או null אם לא נמצאה
 */
exports.deleteMessageById = async (id) => {
  return await ContactMessage.findByIdAndDelete(id);
};

/**
 * מעדכן סטטוס טיפול בהודעה
 * @param {string} id - מזהה ההודעה
 * @param {boolean} handled - האם ההודעה טופלה
 * @returns {Promise<Object|null>} - ההודעה המעודכנת
 */
exports.updateHandledStatus = async (id, handled) => {
  const handledAt = handled ? new Date() : null;
  return await ContactMessage.findByIdAndUpdate(
    id,
    { handled, handledAt },
    { new: true }
  );
};
