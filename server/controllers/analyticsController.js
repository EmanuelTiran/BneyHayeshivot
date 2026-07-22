const analyticsService = require('../services/analyticsService');
const activeUsersService = require(
  '../services/analyticsActiveUsersService'
);

const {
  resolveAnalyticsDateRange,
} = require('../utils/analyticsDateRange');

const {
  AnalyticsValidationError,
  getRequestSiteHost,
  isLikelyBot,
  shouldRespectPrivacySignal,
} = require('../utils/analyticsUtils');

function buildRequestContext(req) {
  return {
    user: req.user || null,
    userAgent: req.get('user-agent') || '',
    siteHost: getRequestSiteHost(req),
  };
}

function shouldIgnoreRequest(req) {
  return (
    shouldRespectPrivacySignal(req) ||
    isLikelyBot(req.get('user-agent') || '')
  );
}

function handleCollectionError(error, res) {
  if (
    error instanceof AnalyticsValidationError ||
    error?.statusCode === 400
  ) {
    return res.status(400).json({
      message: error.message,
    });
  }

  console.error(
    '[Analytics] Collection failed:',
    error.message
  );

  return res.status(500).json({
    message: 'אירוע הסטטיסטיקה לא התקבל',
  });
}

exports.collectPageView = async (req, res) => {
  try {
    if (shouldIgnoreRequest(req)) {
      return res.status(202).json({
        accepted: true,
      });
    }

    await analyticsService.collectPageView(
      req.body || {},
      buildRequestContext(req)
    );

    return res.status(202).json({
      accepted: true,
    });
  } catch (error) {
    return handleCollectionError(error, res);
  }
};

exports.recordHeartbeat = async (req, res) => {
  try {
    if (shouldIgnoreRequest(req)) {
      return res.status(202).json({
        accepted: true,
      });
    }

    await analyticsService.recordHeartbeat(
      req.body || {},
      buildRequestContext(req)
    );

    return res.status(202).json({
      accepted: true,
    });
  } catch (error) {
    return handleCollectionError(error, res);
  }
};

exports.getReport = async (req, res) => {
  try {
    const range = resolveAnalyticsDateRange(req.query);
    const report = await analyticsService.getAnalyticsReport(
      range
    );

    return res.json(report);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(
      '[Analytics] Report generation failed:',
      error.message
    );

    return res.status(500).json({
      message: 'יצירת דוח הסטטיסטיקות נכשלה',
    });
  }
};

exports.getActiveUsers = async (_req, res) => {
  try {
    const activeUsers =
      await activeUsersService.getActiveAuthenticatedUsers();

    return res.json(activeUsers);
  } catch (error) {
    console.error(
      '[Analytics] Active users report failed:',
      error.message
    );

    return res.status(500).json({
      message: 'טעינת המשתמשים הפעילים נכשלה',
    });
  }
};