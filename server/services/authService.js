const User  = require('../models/User');
const jwt   = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── עזר: יצירת טוקנים ────────────────────────────────────────────────────────

const generateTokens = (user) => {
  const payload = { userId: user._id, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',           // קצר — מתרענן בשקט
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',            // ארוך — נשמר ב-DB
  });

  return { accessToken, refreshToken };
};

// ── הרשמה ────────────────────────────────────────────────────────────────────

exports.register = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

// ── התחברות רגילה ─────────────────────────────────────────────────────────────

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // שמור refresh token ב-DB (מחיקת ישן)
  user.refreshToken = refreshToken;
  await user.save();

  return { token: accessToken, refreshToken, user };
};

// ── התחברות גוגל ─────────────────────────────────────────────────────────────

exports.googleLogin = async (credential) => {
  const ticket = await googleClient.verifyIdToken({
    idToken:  credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, name, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (!user) {
    // יצירת משתמש חדש בהתחברות ראשונה עם גוגל
    user = await User.create({
      email,
      name,
      googleId,
      role: 'member',           // ברירת מחדל
      password: Math.random().toString(36), // placeholder — לא ישמש
    });
  }

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { token: accessToken, refreshToken, user };
};

// ── רענון טוקן ───────────────────────────────────────────────────────────────

exports.refreshToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw new Error('No refresh token');

  // אמת את הטוקן
  let payload;
  try {
    payload = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  // וודא שהטוקן תואם למה שב-DB (מניעת שימוש חוזר לאחר logout)
  const user = await User.findById(payload.userId);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new Error('Refresh token revoked');
  }

  // צור זוג חדש (rotation — מניעת גניבת טוקן)
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  user.refreshToken = newRefreshToken;
  await user.save();

  return { token: accessToken, refreshToken: newRefreshToken };
};

// ── התנתקות ───────────────────────────────────────────────────────────────────

exports.logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};