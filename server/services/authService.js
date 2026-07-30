const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ── עזר: יצירת טוקנים ────────────────────────────────────────────────────────

const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '30d',
    }
  );

  return {
    accessToken,
    refreshToken,
  };
};

// ── הרשמה באמצעות מייל ────────────────────────────────────────────────────────

exports.register = async (userData) => {
  const email = normalizeEmail(userData.email);

  if (!email) {
    throw createHttpError('נא לספק כתובת אימייל', 400);
  }

  if (!userData.password || userData.password.length < 6) {
    throw createHttpError(
      'הסיסמה חייבת להכיל לפחות 6 תווים',
      400
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.isFullyRegistered !== false) {
      throw createHttpError(
        'כתובת אימייל זו כבר רשומה במערכת',
        409
      );
    }

    /*
     * זהו משתמש שהמנהל הוסיף ידנית לרשימת התפוצה.
     * משלימים את אותה רשומה במקום ליצור משתמש כפול.
     *
     * receivesNewsletter אינו משתנה, ולכן הבחירה של המנהל
     * אם לשלוח לאותו משתמש עדכונים נשמרת.
     */
    existingUser.name =
      userData.name?.trim() || existingUser.name;

    existingUser.password = userData.password;

    existingUser.phone =
      userData.phone?.trim() || existingUser.phone;

    existingUser.isFullyRegistered = true;

    await existingUser.save();

    return existingUser;
  }

  const user = new User({
    ...userData,
    name: userData.name?.trim(),
    email,
    phone: userData.phone?.trim(),
    isFullyRegistered: true,
  });

  return user.save();
};

// ── התחברות באמצעות מייל וסיסמה ──────────────────────────────────────────────

exports.login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  });

  const passwordMatches =
    user && typeof password === 'string'
      ? await user.comparePassword(password)
      : false;

  if (!user || !passwordMatches) {
    throw new Error('Invalid credentials');
  }

  /*
   * תיקון עצמי לרשומות ישנות:
   * אם למשתמש יש סיסמה תקינה והוא הצליח להתחבר,
   * הוא בהכרח משתמש רשום.
   */
  user.isFullyRegistered = true;

  const {
    accessToken,
    refreshToken,
  } = generateTokens(user);

  user.refreshToken = refreshToken;

  await user.save();

  return {
    token: accessToken,
    refreshToken,
    user,
  };
};

// ── התחברות באמצעות Google ───────────────────────────────────────────────────

exports.googleLogin = async (credential) => {
  if (!credential) {
    throw createHttpError(
      'לא התקבל אסימון התחברות מ-Google',
      400
    );
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const email = normalizeEmail(payload?.email);

  const googleName =
    typeof payload?.name === 'string'
      ? payload.name.trim()
      : '';

  const googleId = payload?.sub;

  if (
    !email ||
    !googleId ||
    payload?.email_verified !== true
  ) {
    throw createHttpError(
      'חשבון Google לא החזיר כתובת אימייל מאומתת',
      401
    );
  }

  let user = await User.findOne({ email });

  if (!user) {
    /*
     * משתמש חדש לגמרי:
     * נוצרת רשומה מלאה ולא רשומת תפוצה בלבד.
     */
    user = new User({
      email,
      name: googleName || email,
      googleId,
      role: 'member',
      isFullyRegistered: true,
      receivesNewsletter: true,
    });
  } else {
    /*
     * הגנה מפני קישור כתובת אימייל לחשבון Google שונה
     * מזה שכבר חובר בעבר.
     */
    if (
      user.googleId &&
      user.googleId !== googleId
    ) {
      throw createHttpError(
        'כתובת האימייל כבר מקושרת לחשבון Google אחר',
        409
      );
    }

    /*
     * אם המנהל הוסיף את האימייל ידנית לרשימת התפוצה,
     * משתמשים באותה רשומה ולא יוצרים רשומה נוספת.
     */
    if (
      user.isFullyRegistered === false &&
      googleName
    ) {
      user.name = googleName;
    }

    user.googleId = googleId;
    user.isFullyRegistered = true;
  }

  const {
    accessToken,
    refreshToken,
  } = generateTokens(user);

  user.refreshToken = refreshToken;

  await user.save();

  return {
    token: accessToken,
    refreshToken,
    user,
  };
};

// ── רענון טוקן ───────────────────────────────────────────────────────────────

exports.refreshToken = async (
  incomingRefreshToken
) => {
  if (!incomingRefreshToken) {
    throw new Error('No refresh token');
  }

  let payload;

  try {
    payload = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    throw new Error(
      'Invalid or expired refresh token'
    );
  }

  const user = await User.findById(
    payload.userId
  );

  if (
    !user ||
    user.refreshToken !== incomingRefreshToken
  ) {
    throw new Error('Refresh token revoked');
  }

  /*
   * תיקון עצמי למשתמשים שהתחברו באמצעות Google
   * עוד לפני שהתיקון הוטמע.
   */
  user.isFullyRegistered = true;

  const {
    accessToken,
    refreshToken: newRefreshToken,
  } = generateTokens(user);

  user.refreshToken = newRefreshToken;

  await user.save();

  return {
    token: accessToken,
    refreshToken: newRefreshToken,
  };
};

// ── התנתקות ───────────────────────────────────────────────────────────────────

exports.logout = async (userId) => {
  await User.findByIdAndUpdate(
    userId,
    {
      refreshToken: null,
    }
  );
};