const mongoose = require('mongoose');

const analyticsSessionSchema = new mongoose.Schema(
  {
    sessionKey: {
      type: String,
      required: true,
      minlength: 64,
      maxlength: 64,
    },

    visitorKey: {
      type: String,
      required: true,
      minlength: 64,
      maxlength: 64,
    },

    environment: {
      type: String,
      enum: ['production', 'development', 'test'],
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    lastActiveAt: {
      type: Date,
      required: true,
    },

    lastHeartbeatAt: {
      type: Date,
      default: null,
    },

    lastHeartbeatEventKey: {
      type: String,
      default: '',
      maxlength: 64,
    },

    activeDurationMs: {
      type: Number,
      min: 0,
      default: 0,
    },

    firstPage: {
      type: String,
      required: true,
      maxlength: 300,
    },

    lastPage: {
      type: String,
      required: true,
      maxlength: 300,
    },

    sourceCategory: {
      type: String,
      enum: [
        'direct',
        'google',
        'social',
        'referral',
        'internal',
        'unknown',
      ],
      default: 'unknown',
    },

    referrerHost: {
      type: String,
      default: '',
      maxlength: 253,
    },

    utmSource: {
      type: String,
      default: '',
      maxlength: 64,
    },

    deviceType: {
      type: String,
      enum: [
        'mobile',
        'desktop',
        'tablet',
        'unknown',
      ],
      default: 'unknown',
    },

    browser: {
      type: String,
      enum: [
        'Chrome',
        'Edge',
        'Firefox',
        'Safari',
        'Samsung Internet',
        'Opera',
        'Other',
      ],
      default: 'Other',
    },

    os: {
      type: String,
      enum: [
        'Android',
        'iOS',
        'Windows',
        'macOS',
        'Linux',
        'ChromeOS',
        'Other',
      ],
      default: 'Other',
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

analyticsSessionSchema.index(
  {
    environment: 1,
    sessionKey: 1,
  },
  {
    unique: true,
  }
);

analyticsSessionSchema.index({
  environment: 1,
  startedAt: 1,
});

analyticsSessionSchema.index({
  environment: 1,
  lastActiveAt: -1,
});

analyticsSessionSchema.index({
  environment: 1,
  visitorKey: 1,
  startedAt: 1,
});

analyticsSessionSchema.index({
  environment: 1,
  sourceCategory: 1,
  startedAt: 1,
});

analyticsSessionSchema.index({
  userId: 1,
  startedAt: -1,
});

analyticsSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

module.exports = mongoose.model(
  'AnalyticsSession',
  analyticsSessionSchema
);