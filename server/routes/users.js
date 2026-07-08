const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');

// עזר: ודא שהמבקש הוא אדמין
const ensureAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'גישה אסורה' });
    return false;
  }
  return true;
};

// רשימת כל המשתמשים – לאדמין בלבד
router.get('/', protect, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// הוספת משתמש ידנית לרשימת התפוצה – לאדמין בלבד
router.post('/', protect, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'נא למלא שם ואימייל' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'כתובת אימייל זו כבר קיימת במערכת' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      role: 'member',
      isActive: true,
      isFullyRegistered: false,
      receivesNewsletter: true,
    });

    const { password, refreshToken, ...safeUser } = newUser.toObject();
    res.status(201).json(safeUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'כתובת אימייל זו כבר קיימת במערכת' });
    }
    res.status(500).json({ message: err.message });
  }
});

// ← חדש: עריכת שם/אימייל – לאדמין בלבד
router.put('/:id', protect, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'נא למלא שם ואימייל' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ודא שהאימייל לא שייך למשתמש אחר
    const emailOwner = await User.findOne({ email: normalizedEmail });
    if (emailOwner && emailOwner._id.toString() !== req.params.id) {
      return res.status(409).json({ message: 'כתובת אימייל זו כבר בשימוש על ידי משתמש אחר' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), email: normalizedEmail },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updated) return res.status(404).json({ message: 'משתמש לא נמצא' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'כתובת אימייל זו כבר בשימוש' });
    }
    res.status(400).json({ message: err.message });
  }
});

// ← חדש: הפעלה/ביטול קבלת עדכוני מייל (הצ'קבוקס) – לאדמין בלבד
router.patch('/:id/newsletter', protect, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { receivesNewsletter } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { receivesNewsletter: Boolean(receivesNewsletter) },
      { new: true }
    ).select('-password -refreshToken');

    if (!updated) return res.status(404).json({ message: 'משתמש לא נמצא' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ← חדש: מחיקת משתמש – לאדמין בלבד (עם הגנות בטיחות)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'לא ניתן למחוק את המשתמש המחובר כרגע' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'משתמש לא נמצא' });

    if (target.role === 'admin') {
      return res.status(400).json({ message: 'לא ניתן למחוק חשבון מנהל דרך מסך זה' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'המשתמש נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;