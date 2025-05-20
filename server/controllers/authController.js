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
