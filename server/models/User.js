const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    minlength: 6,
    // ← אופציונלי: משתמשי גוגל / placeholders לא יצטרכו סיסמה מיד
  },
  googleId: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String,
    default: null,
  },
  role: { type: String, enum: ['admin', 'gabbai', 'member'], default: 'member' },
  phone: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },

  // ← חדש: מבדיל בין משתמש מלא לבין placeholder שנוסף ידנית לרשימת תפוצה
  isFullyRegistered: { type: Boolean, default: true },
  receivesNewsletter: { type: Boolean, default: true },

});

// ⚠️ חובה שה-pre-save וה-methods יהיו כאן, **לפני** ה-module.exports!

// ה-pre save רץ רק אם הסיסמה קיימת ושונתה
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// ⚠️ שורת ה-export חייבת להיות האחרונה בקובץ!
module.exports = mongoose.model('User', userSchema);