const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'גישה נדחתה, אין משתמש מאומת' });
    }

    const user = await User.findById(req.user.userId)
      .select('role isActive')
      .lean();

    if (!user || user.isActive === false) {
      return res.status(401).json({ message: 'המשתמש אינו פעיל' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'גישה למנהלים בלבד' });
    }

    req.adminUser = user;
    return next();
  } catch (error) {
    console.error('[Analytics] Admin authorization failed:', error.message);
    return res.status(500).json({ message: 'בדיקת הרשאת מנהל נכשלה' });
  }
};