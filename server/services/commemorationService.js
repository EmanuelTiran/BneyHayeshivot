const Commemoration = require('../models/Commemoration');

/**
 * מחזיר את כל ההנצחות, מסודרות מהחדשה לישנה
 */
exports.getAllCommemorations = async () => {
  return Commemoration.find().sort({ date: -1 });
};

/**
 * יוצר הנצחה חדשה
 * @param {Object} data - הנתונים של ההנצחה החדשה
 */
exports.createCommemoration = async (data) => {
  const commemoration = new Commemoration(data);
  return commemoration.save();
};

/**
 * מעדכן הנצחה קיימת לפי מזהה
 * @param {string} id - מזהה ההנצחה
 * @param {Object} data - הנתונים המעודכנים
 */
exports.updateCommemoration = async (id, data) => {
  return Commemoration.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * מוחק הנצחה לפי מזהה
 * @param {string} id - מזהה ההנצחה
 */
exports.deleteCommemoration = async (id) => {
  return Commemoration.findByIdAndDelete(id);
};

/**
 * מחזיר הנצחה בודדת לפי מזהה
 * @param {string} id - מזהה ההנצחה
 */
exports.getCommemorationById = async (id) => {
  return Commemoration.findById(id);
};