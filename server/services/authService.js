const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const AuthSession = require('../models/AuthSession');
const User = require('../models/User');

const {
  createAuthSessionExpiry,
  createRefreshToken,
  hashRefreshToken,
} = require('../utils/authSessionUtils');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const normalizeEmail = (email) =>
  typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

function toPublicUser(user) {
  return {
    _id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'member',
    phone: user.phone || '',
    createdAt: user.createdAt || null,
    isActive: user.isActive !== false,
    isFullyRegistered:
      user.isFullyRegistered !== false,
    receivesNewsletter:
      user.receivesNewsletter !== false,
  };
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );
}

async function createPersistentSession(user, now = new Date()) {
  let refreshToken;
  let tokenHash;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    refreshToken = createRefreshToken();
    tokenHash = hashRefreshToken(refreshToken);

    try {
      await AuthSession.create({
        userId: user._id,
        tokenHash,
        createdAt: now,
        lastUsedAt: now,
        expiresAt: createAuthSessionExpiry(now),
      });

      return {
        token: generateAccessToken(user),
        refreshToken,
        user: toPublicUser(user),
      };
    } catch (error) {
      if (error?.code !== 11000 || attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error('Failed to create authentication session');
}

async function findActiveUser(userId) {
  return User.findOne({
    _id: userId,
    isActive: { $ne: false },
    isFullyRegistered: { $ne: false },
  });
}

async function migrateLegacyRefreshToken(
  incomingRefreshToken,
  now
) {
  if (!process.env.JWT_REFRESH_SECRET) return null;

  let payload;

  try {
    payload = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    return null;
  }

  const user = await User.findOne({
    _id: payload?.userId,
    refreshToken: incomingRefreshToken,
    isActive: { $ne: false },
    isFullyRegistered: { $ne: false },
  }).select('+refreshToken');

  if (!user) return null;

  const session = await createPersistentSession(user, now);

  user.refreshToken = null;
  await user.save();

  return session;
}

// ── Registration ─────────────────────────────────────────────────────────────

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

    existingUser.name =
      userData.name?.trim() || existingUser.name;
    existingUser.password = userData.password;
    existingUser.phone =
      userData.phone?.trim() || existingUser.phone;
    existingUser.isFullyRegistered = true;

    await existingUser.save();
    return toPublicUser(existingUser);
  }

  const user = new User({
    ...userData,
    name: userData.name?.trim(),
    email,
    phone: userData.phone?.trim(),
    isFullyRegistered: true,
  });

  await user.save();
  return toPublicUser(user);
};

// ── Email/password login ─────────────────────────────────────────────────────

exports.login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    email: normalizedEmail,
  });

  const passwordMatches =
    user && typeof password === 'string'
      ? await user.comparePassword(password)
      : false;

  if (
    !user ||
    !passwordMatches ||
    user.isActive === false
  ) {
    throw createHttpError('Invalid credentials', 401);
  }

  user.isFullyRegistered = true;
  await user.save();

  return createPersistentSession(user);
};

// ── Google login ─────────────────────────────────────────────────────────────

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
    user = new User({
      email,
      name: googleName || email,
      googleId,
      role: 'member',
      isFullyRegistered: true,
      receivesNewsletter: true,
    });
  } else {
    if (user.isActive === false) {
      throw createHttpError('החשבון אינו פעיל', 403);
    }

    if (user.googleId && user.googleId !== googleId) {
      throw createHttpError(
        'כתובת האימייל כבר מקושרת לחשבון Google אחר',
        409
      );
    }

    if (
      user.isFullyRegistered === false &&
      googleName
    ) {
      user.name = googleName;
    }

    user.googleId = googleId;
    user.isFullyRegistered = true;
  }

  await user.save();
  return createPersistentSession(user);
};

// ── Persistent session refresh ───────────────────────────────────────────────

exports.refreshSession = async (incomingRefreshToken) => {
  const tokenHash = hashRefreshToken(incomingRefreshToken);

  if (!tokenHash) {
    throw createHttpError('No refresh session', 401);
  }

  const now = new Date();
  const authSession = await AuthSession.findOne({
    tokenHash,
    expiresAt: { $gt: now },
  });

  if (!authSession) {
    const migratedSession =
      await migrateLegacyRefreshToken(
        incomingRefreshToken,
        now
      );

    if (migratedSession) return migratedSession;

    throw createHttpError(
      'Invalid or expired refresh session',
      401
    );
  }

  const user = await findActiveUser(authSession.userId);

  if (!user) {
    await AuthSession.deleteOne({ _id: authSession._id });
    throw createHttpError('Refresh session revoked', 401);
  }

  authSession.lastUsedAt = now;
  authSession.expiresAt = createAuthSessionExpiry(now);
  await authSession.save();

  return {
    token: generateAccessToken(user),
    refreshToken: incomingRefreshToken,
    user: toPublicUser(user),
  };
};

// ── Logout current browser ───────────────────────────────────────────────────

exports.logoutSession = async (incomingRefreshToken) => {
  const tokenHash = hashRefreshToken(incomingRefreshToken);

  if (!tokenHash) return;

  const deletion = await AuthSession.deleteOne({ tokenHash });

  if (deletion.deletedCount > 0) return;

  if (!process.env.JWT_REFRESH_SECRET) return;

  try {
    const payload = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    await User.updateOne(
      {
        _id: payload?.userId,
        refreshToken: incomingRefreshToken,
      },
      {
        $set: { refreshToken: null },
      }
    );
  } catch {
    // Logout is idempotent. Invalid or expired cookies are simply cleared.
  }
};
