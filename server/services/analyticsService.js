const AnalyticsVisitor = require('../models/AnalyticsVisitor');
const AnalyticsSession = require('../models/AnalyticsSession');
const AnalyticsPageView = require('../models/AnalyticsPageView');

const {
  classifySource,
  createExpiryDate,
  getAnalyticsEnvironment,
  getRetentionDays,
  hashIdentifier,
  parseUserAgent,
  requireUuid,
  sanitizeActiveMs,
  sanitizeHostname,
  sanitizePath,
  sanitizeUtmSource,
  shouldExcludeAdmin,
} = require('../utils/analyticsUtils');

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVE_WINDOW_MS = 90 * 1000;
const MIN_HEARTBEAT_GAP_MS = 15 * 1000;
const PAGE_VIEW_DEDUPE_WINDOW_MS = 2 * 1000;

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function getVerifiedUserId(user) {
  return user?.userId || null;
}

async function updateVisitor({ environment, visitorKey, now, expiresAt }) {
  await AnalyticsVisitor.updateOne(
    { environment, visitorKey },
    {
      $setOnInsert: { firstSeenAt: now },
      $set: { lastSeenAt: now, expiresAt },
    },
    { upsert: true, runValidators: true }
  );
}

async function getCompatibleSession({
  environment,
  sessionKey,
  visitorKey,
  now,
}) {
  const existing = await AnalyticsSession.findOne({
    environment,
    sessionKey,
  });

  if (!existing) return null;
  if (existing.visitorKey !== visitorKey) return false;

  const lastActivity = existing.lastActiveAt || existing.startedAt;

  if (now.getTime() - lastActivity.getTime() >= SESSION_TIMEOUT_MS) {
    return false;
  }

  return existing;
}

async function upsertSessionForPageView({
  environment,
  sessionKey,
  visitorKey,
  userId,
  path,
  referrerHost,
  utmSource,
  sourceCategory,
  device,
  now,
  expiresAt,
}) {
  const setFields = {
    lastActiveAt: now,
    lastPage: path,
    expiresAt,
  };

  if (userId) setFields.userId = userId;

  await AnalyticsSession.updateOne(
    { environment, sessionKey, visitorKey },
    {
      $setOnInsert: {
        startedAt: now,
        firstPage: path,
        sourceCategory,
        referrerHost,
        utmSource,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
      },
      $set: setFields,
    },
    { upsert: true, runValidators: true }
  );
}

async function collectPageView(payload, context) {
  if (shouldExcludeAdmin(context.user)) {
    return { accepted: false };
  }

  const eventId = requireUuid(payload.eventId, 'eventId');
  const visitorId = requireUuid(payload.visitorId, 'visitorId');
  const sessionId = requireUuid(payload.sessionId, 'sessionId');
  const path = sanitizePath(payload.path);
  const referrerHost = sanitizeHostname(payload.referrerHost);
  const utmSource = sanitizeUtmSource(payload.utmSource);

  const environment = getAnalyticsEnvironment();
  const now = new Date();
  const expiresAt = createExpiryDate(now);

  const eventKey = hashIdentifier('event', eventId);
  const visitorKey = hashIdentifier('visitor', visitorId);
  const sessionKey = hashIdentifier('session', sessionId);

  const dedupeBucket = Math.floor(
    now.getTime() / PAGE_VIEW_DEDUPE_WINDOW_MS
  );

  const dedupeKey = hashIdentifier(
    'pageview-dedupe',
    `${sessionId}:${path}:${dedupeBucket}`
  );

  const userId = getVerifiedUserId(context.user);
  const device = parseUserAgent(context.userAgent);

  const sourceCategory = classifySource({
    referrerHost,
    utmSource,
    siteHost: context.siteHost,
  });

  const existingEvent = await AnalyticsPageView.exists({
    environment,
    eventKey,
  });

  if (existingEvent) {
    return { accepted: false };
  }

  const compatibleSession = await getCompatibleSession({
    environment,
    sessionKey,
    visitorKey,
    now,
  });

  if (compatibleSession === false) {
    return { accepted: false };
  }

  await Promise.all([
    updateVisitor({
      environment,
      visitorKey,
      now,
      expiresAt,
    }),
    upsertSessionForPageView({
      environment,
      sessionKey,
      visitorKey,
      userId,
      path,
      referrerHost,
      utmSource,
      sourceCategory,
      device,
      now,
      expiresAt,
    }),
  ]);

  try {
    await AnalyticsPageView.create({
      eventKey,
      dedupeKey,
      sessionKey,
      visitorKey,
      userId,
      environment,
      path,
      viewedAt: now,
      expiresAt,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { accepted: false };
    }

    throw error;
  }

  return { accepted: true };
}

async function recordHeartbeat(payload, context) {
  if (shouldExcludeAdmin(context.user)) {
    return { accepted: false };
  }

  const eventId = requireUuid(payload.eventId, 'eventId');
  const visitorId = requireUuid(payload.visitorId, 'visitorId');
  const sessionId = requireUuid(payload.sessionId, 'sessionId');
  const activeMs = sanitizeActiveMs(payload.activeMs);

  const environment = getAnalyticsEnvironment();
  const now = new Date();
  const expiresAt = createExpiryDate(now);

  const eventKey = hashIdentifier('heartbeat-event', eventId);
  const visitorKey = hashIdentifier('visitor', visitorId);
  const sessionKey = hashIdentifier('session', sessionId);
  const userId = getVerifiedUserId(context.user);

  const session = await AnalyticsSession.findOne({
    environment,
    sessionKey,
    visitorKey,
  });

  if (!session) {
    return { accepted: false };
  }

  const lastActivity = session.lastActiveAt || session.startedAt;

  if (now.getTime() - lastActivity.getTime() >= SESSION_TIMEOUT_MS) {
    return { accepted: false };
  }

  if (session.lastHeartbeatEventKey === eventKey) {
    return { accepted: false };
  }

  if (
    session.lastHeartbeatAt &&
    now.getTime() - session.lastHeartbeatAt.getTime() <
      MIN_HEARTBEAT_GAP_MS
  ) {
    return { accepted: false };
  }

  const elapsedWallTime = Math.max(
    0,
    now.getTime() - session.startedAt.getTime()
  );

  const remainingWallTime = Math.max(
    0,
    elapsedWallTime - session.activeDurationMs
  );

  const durationIncrement = Math.min(
    activeMs,
    remainingWallTime
  );

  const heartbeatCutoff = new Date(
    now.getTime() - MIN_HEARTBEAT_GAP_MS
  );

  const setFields = {
    lastActiveAt: now,
    lastHeartbeatAt: now,
    lastHeartbeatEventKey: eventKey,
    expiresAt,
  };

  if (userId) setFields.userId = userId;

  const updated = await AnalyticsSession.findOneAndUpdate(
    {
      _id: session._id,
      lastHeartbeatEventKey: { $ne: eventKey },
      $or: [
        { lastHeartbeatAt: null },
        { lastHeartbeatAt: { $lte: heartbeatCutoff } },
      ],
    },
    {
      $set: setFields,
      $inc: { activeDurationMs: durationIncrement },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updated) {
    return { accepted: false };
  }

  await updateVisitor({
    environment,
    visitorKey,
    now,
    expiresAt,
  });

  return { accepted: true };
}

function buildDateTrunc(dateField, range) {
  const expression = {
    date: dateField,
    unit: range.granularity,
    timezone: range.timeZone,
  };

  if (range.granularity === 'week') {
    expression.startOfWeek = 'sunday';
  }

  return {
    $dateTrunc: expression,
  };
}

async function aggregateTimeline(
  model,
  dateField,
  range,
  environment
) {
  return model.aggregate([
    {
      $match: {
        environment,
        [dateField]: {
          $gte: range.from,
          $lt: range.to,
        },
      },
    },
    {
      $group: {
        _id: buildDateTrunc(`$${dateField}`, range),
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

function mergeTimelines(pageViews, sessions) {
  const buckets = new Map();

  for (const item of pageViews) {
    const key = item._id.toISOString();

    buckets.set(key, {
      bucket: key,
      pageViews: item.count,
      sessions: 0,
    });
  }

  for (const item of sessions) {
    const key = item._id.toISOString();

    const existing = buckets.get(key) || {
      bucket: key,
      pageViews: 0,
      sessions: 0,
    };

    existing.sessions = item.count;
    buckets.set(key, existing);
  }

  return [...buckets.values()].sort(
    (a, b) => new Date(a.bucket) - new Date(b.bucket)
  );
}

async function aggregateSessionField(
  field,
  range,
  environment,
  limit = 10
) {
  const allowedFields = new Set([
    'deviceType',
    'sourceCategory',
    'browser',
    'os',
    'firstPage',
    'lastPage',
  ]);

  if (!allowedFields.has(field)) {
    throw new Error('Unsupported analytics aggregation field.');
  }

  const rows = await AnalyticsSession.aggregate([
    {
      $match: {
        environment,
        startedAt: {
          $gte: range.from,
          $lt: range.to,
        },
      },
    },
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
        _id: 1,
      },
    },
    {
      $limit: limit,
    },
  ]);

  return rows.map((row) => ({
    name: row._id || 'unknown',
    count: row.count,
  }));
}

async function aggregateNewReturning(range, environment) {
  const rows = await AnalyticsPageView.aggregate([
    {
      $match: {
        environment,
        viewedAt: {
          $gte: range.from,
          $lt: range.to,
        },
      },
    },
    {
      $group: {
        _id: '$visitorKey',
      },
    },
    {
      $lookup: {
        from: AnalyticsVisitor.collection.name,
        let: {
          visitorKey: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$visitorKey', '$$visitorKey'],
                  },
                  {
                    $eq: ['$environment', environment],
                  },
                ],
              },
            },
          },
          {
            $project: {
              firstSeenAt: 1,
            },
          },
        ],
        as: 'visitor',
      },
    },
    {
      $unwind: '$visitor',
    },
    {
      $group: {
        _id: null,
        newVisitors: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $gte: [
                      '$visitor.firstSeenAt',
                      range.from,
                    ],
                  },
                  {
                    $lt: [
                      '$visitor.firstSeenAt',
                      range.to,
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        returningVisitors: {
          $sum: {
            $cond: [
              {
                $lt: [
                  '$visitor.firstSeenAt',
                  range.from,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return rows[0] || {
    newVisitors: 0,
    returningVisitors: 0,
  };
}

async function getAnalyticsReport(range) {
  const environment = getAnalyticsEnvironment();
  const now = new Date();

  const activeCutoff = new Date(
    now.getTime() - ACTIVE_WINDOW_MS
  );

  const pageViewMatch = {
    environment,
    viewedAt: {
      $gte: range.from,
      $lt: range.to,
    },
  };

  const sessionMatch = {
    environment,
    startedAt: {
      $gte: range.from,
      $lt: range.to,
    },
  };

  const [
    pageViews,
    sessions,
    uniqueVisitorRows,
    activeVisitorRows,
    durationRows,
    pageViewTimeline,
    sessionTimeline,
    topPages,
    devices,
    sources,
    browsers,
    operatingSystems,
    entryPages,
    lastPages,
    visitorTypes,
    recentSessionDocuments,
  ] = await Promise.all([
    AnalyticsPageView.countDocuments(pageViewMatch),

    AnalyticsSession.countDocuments(sessionMatch),

    AnalyticsPageView.aggregate([
      {
        $match: pageViewMatch,
      },
      {
        $group: {
          _id: '$visitorKey',
        },
      },
      {
        $count: 'count',
      },
    ]),

    AnalyticsSession.aggregate([
      {
        $match: {
          environment,
          lastActiveAt: {
            $gte: activeCutoff,
          },
        },
      },
      {
        $group: {
          _id: '$visitorKey',
        },
      },
      {
        $count: 'count',
      },
    ]),

    AnalyticsSession.aggregate([
      {
        $match: {
          ...sessionMatch,
          lastActiveAt: {
            $lt: activeCutoff,
          },
        },
      },
      {
        $group: {
          _id: null,
          average: {
            $avg: '$activeDurationMs',
          },
        },
      },
    ]),

    aggregateTimeline(
      AnalyticsPageView,
      'viewedAt',
      range,
      environment
    ),

    aggregateTimeline(
      AnalyticsSession,
      'startedAt',
      range,
      environment
    ),

    AnalyticsPageView.aggregate([
      {
        $match: pageViewMatch,
      },
      {
        $group: {
          _id: '$path',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
          _id: 1,
        },
      },
      {
        $limit: 10,
      },
    ]),

    aggregateSessionField(
      'deviceType',
      range,
      environment
    ),

    aggregateSessionField(
      'sourceCategory',
      range,
      environment
    ),

    aggregateSessionField(
      'browser',
      range,
      environment
    ),

    aggregateSessionField(
      'os',
      range,
      environment
    ),

    aggregateSessionField(
      'firstPage',
      range,
      environment
    ),

    aggregateSessionField(
      'lastPage',
      range,
      environment
    ),

    aggregateNewReturning(
      range,
      environment
    ),

    AnalyticsSession.find(sessionMatch)
      .select(
        'startedAt lastActiveAt activeDurationMs firstPage lastPage sourceCategory deviceType browser os userId'
      )
      .sort({
        startedAt: -1,
      })
      .limit(25)
      .lean(),
  ]);

  const recentSessions = recentSessionDocuments.map(
    (session) => ({
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      activeDurationSeconds: Math.round(
        session.activeDurationMs / 1000
      ),
      firstPage: session.firstPage,
      lastPage: session.lastPage,
      source: session.sourceCategory,
      device: session.deviceType,
      browser: session.browser,
      os: session.os,
      authenticated: Boolean(session.userId),
      active:
        session.lastActiveAt.getTime() >=
        activeCutoff.getTime(),
    })
  );

  return {
    range: {
      preset: range.preset,
      from: range.from,
      to: range.to,
      fromDate: range.fromDate,
      toDate: range.toDate,
      dayCount: range.dayCount,
      granularity: range.granularity,
      timeZone: range.timeZone,
      retentionDays: getRetentionDays(),
    },
    generatedAt: now,
    summary: {
      pageViews,
      sessions,
      uniqueVisitors:
        uniqueVisitorRows[0]?.count || 0,
      activeVisitors:
        activeVisitorRows[0]?.count || 0,
      averageSessionDurationSeconds: Math.round(
        (durationRows[0]?.average || 0) / 1000
      ),
      newVisitors:
        visitorTypes.newVisitors || 0,
      returningVisitors:
        visitorTypes.returningVisitors || 0,
    },
    timeline: mergeTimelines(
      pageViewTimeline,
      sessionTimeline
    ),
    topPages: topPages.map((row) => ({
      path: row._id,
      count: row.count,
    })),
    devices,
    sources,
    browsers,
    operatingSystems,
    entryPages,
    lastPages,
    recentSessions,
  };
}

module.exports = {
  ACTIVE_WINDOW_MS,
  PAGE_VIEW_DEDUPE_WINDOW_MS,
  SESSION_TIMEOUT_MS,
  collectPageView,
  getAnalyticsReport,
  recordHeartbeat,
};