const AnalyticsSession = require('../models/AnalyticsSession');
const User = require('../models/User');

const { ACTIVE_WINDOW_MS } = require('./analyticsService');
const {
  getAnalyticsEnvironment,
} = require('../utils/analyticsUtils');

const MAX_ACTIVE_USERS = 100;

async function getActiveAuthenticatedUsers() {
  const environment = getAnalyticsEnvironment();
  const generatedAt = new Date();
  const activeCutoff = new Date(
    generatedAt.getTime() - ACTIVE_WINDOW_MS
  );

  const [result = {}] = await AnalyticsSession.aggregate([
    {
      $match: {
        environment,
        userId: { $ne: null },
        lastActiveAt: { $gte: activeCutoff },
      },
    },
    {
      $sort: {
        lastActiveAt: -1,
        startedAt: -1,
      },
    },
    {
      $group: {
        _id: '$userId',
        activeSessionCount: { $sum: 1 },
        startedAt: { $first: '$startedAt' },
        lastActiveAt: { $first: '$lastActiveAt' },
        lastPage: { $first: '$lastPage' },
        device: { $first: '$deviceType' },
        browser: { $first: '$browser' },
        os: { $first: '$os' },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: {
          requestedUserId: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$requestedUserId'],
              },
            },
          },
          {
            $match: {
              isActive: { $ne: false },
              isFullyRegistered: { $ne: false },
              role: { $in: ['member', 'gabbai'] },
            },
          },
          {
            $project: {
              _id: 0,
              name: 1,
              email: 1,
              role: 1,
            },
          },
        ],
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $facet: {
        metadata: [
          {
            $count: 'total',
          },
        ],
        users: [
          {
            $sort: {
              lastActiveAt: -1,
            },
          },
          {
            $limit: MAX_ACTIVE_USERS,
          },
          {
            $project: {
              _id: 0,
              name: '$user.name',
              email: '$user.email',
              role: '$user.role',
              startedAt: 1,
              lastActiveAt: 1,
              lastPage: 1,
              device: 1,
              browser: 1,
              os: 1,
              activeSessionCount: 1,
            },
          },
        ],
      },
    },
  ]);

  const users = result.users || [];
  const total = result.metadata?.[0]?.total || 0;

  return {
    generatedAt,
    activeWindowSeconds: Math.round(
      ACTIVE_WINDOW_MS / 1000
    ),
    total,
    displayed: users.length,
    hasMore: total > users.length,
    users,
  };
}

module.exports = {
  MAX_ACTIVE_USERS,
  getActiveAuthenticatedUsers,
};