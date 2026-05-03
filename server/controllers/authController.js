const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'נרשמת בהצלחה', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { token, refreshToken, user } = await authService.login(req.body);

    // Refresh token ב-httpOnly cookie (הכי בטוח)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 ימים
    });

    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const { token, refreshToken, user } = await authService.googleLogin(credential);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

// ← חדש: רענון טוקן
exports.refresh = async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken;
    const { token, refreshToken } = await authService.refreshToken(incomingToken);

    // החלף את ה-cookie (rotation)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: 'SESSION_EXPIRED', detail: err.message });
  }
};

// ← חדש: התנתקות
exports.logout = async (req, res) => {
  try {
    await authService.logout(req.user.userId);
    res.clearCookie('refreshToken');
    res.json({ message: 'התנתקת בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};