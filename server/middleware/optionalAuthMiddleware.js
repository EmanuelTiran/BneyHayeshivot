const jwt = require('jsonwebtoken');

module.exports = (req, _res, next) => {
  req.user = null;

  const authorization = req.header('Authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match) return next();

  try {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET);

    if (decoded?.userId && decoded?.role) {
      req.user = decoded;
    }
  } catch {
    // Analytics is optional. An invalid/expired token is treated as anonymous.
  }

  return next();
};