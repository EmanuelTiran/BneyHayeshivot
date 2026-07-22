const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const analyticsCollectionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (_req, res) => {
    res.status(429).json({ message: 'יותר מדי אירועי Analytics, נסה שוב מאוחר יותר' });
  },
});

const analyticsReportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.userId) return `admin:${req.user.userId}`;
    return `ip:${ipKeyGenerator(req.ip)}`;
  },
  handler: (_req, res) => {
    res.status(429).json({ message: 'יותר מדי בקשות לדוח, נסה שוב בעוד דקה' });
  },
});

module.exports = {
  analyticsCollectionLimiter,
  analyticsReportLimiter,
};