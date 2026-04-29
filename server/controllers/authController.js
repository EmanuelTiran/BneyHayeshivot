const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const newUser = await authService.register(req.body);
    res.status(201).json({ user: newUser });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body; // ה-ID Token שגוגל שולח
    if (!credential) {
      return res.status(400).json({ error: 'לא התקבל token מגוגל' });
    }
    const data = await authService.googleLogin(credential);
    res.json(data);
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(401).json({ error: 'התחברות עם גוגל נכשלה' });
  }
};