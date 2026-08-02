const authService = require('../services/authService');
const {
  getAuthSessionTtlMs,
} = require('../utils/authSessionUtils');

function getRefreshCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: getAuthSessionTtlMs(),
    path: '/',
  };
}

function getRefreshCookieClearOptions() {
  const options = getRefreshCookieOptions();
  delete options.maxAge;

  return options;
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(
    'refreshToken',
    refreshToken,
    getRefreshCookieOptions()
  );
}

async function revokePreviousBrowserSession(
  previousRefreshToken,
  nextRefreshToken
) {
  if (
    !previousRefreshToken ||
    previousRefreshToken === nextRefreshToken
  ) {
    return;
  }

  try {
    await authService.logoutSession(previousRefreshToken);
  } catch (error) {
    console.warn(
      '[Auth] Failed to revoke previous browser session:',
      error.message
    );
  }
}

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      message: 'נרשמת בהצלחה',
      user,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const previousRefreshToken =
      req.cookies?.refreshToken;

    const {
      token,
      refreshToken,
      user,
    } = await authService.login(req.body);

    await revokePreviousBrowserSession(
      previousRefreshToken,
      refreshToken
    );

    setRefreshCookie(res, refreshToken);
    res.json({ token, user });
  } catch (error) {
    res.status(error.statusCode || 401).json({
      message: error.message,
    });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const previousRefreshToken =
      req.cookies?.refreshToken;

    const {
      token,
      refreshToken,
      user,
    } = await authService.googleLogin(
      req.body?.credential
    );

    await revokePreviousBrowserSession(
      previousRefreshToken,
      refreshToken
    );

    setRefreshCookie(res, refreshToken);
    res.json({ token, user });
  } catch (error) {
    res.status(error.statusCode || 401).json({
      error: error.message,
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const {
      token,
      refreshToken,
      user,
    } = await authService.refreshSession(
      req.cookies?.refreshToken
    );

    // Rewriting the cookie renews its rolling expiration.
    setRefreshCookie(res, refreshToken);
    res.json({ token, user });
  } catch (error) {
    res.clearCookie(
      'refreshToken',
      getRefreshCookieClearOptions()
    );

    res.status(error.statusCode || 401).json({
      message: 'SESSION_EXPIRED',
      detail: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logoutSession(
      req.cookies?.refreshToken
    );

    res.clearCookie(
      'refreshToken',
      getRefreshCookieClearOptions()
    );

    res.json({ message: 'התנתקת בהצלחה' });
  } catch (error) {
    res.clearCookie(
      'refreshToken',
      getRefreshCookieClearOptions()
    );

    res.status(500).json({ message: error.message });
  }
};
