const express = require('express');

const router = express.Router();

const controller = require('../controllers/analyticsController');
const protect = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const requireAdmin = require('../middleware/requireAdminMiddleware');

const {
  analyticsCollectionLimiter,
  analyticsReportLimiter,
} = require('../middleware/analyticsRateLimiter');

router.post(
  '/page-view',
  analyticsCollectionLimiter,
  optionalAuth,
  controller.collectPageView
);

router.post(
  '/heartbeat',
  analyticsCollectionLimiter,
  optionalAuth,
  controller.recordHeartbeat
);

router.get(
  '/report',
  protect,
  analyticsReportLimiter,
  requireAdmin,
  controller.getReport
);

module.exports = router;