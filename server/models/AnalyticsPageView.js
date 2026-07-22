const mongoose = require('mongoose');

const analyticsPageViewSchema = new mongoose.Schema(
  {
    eventKey: {
      type: String,
      required: true,
      minlength: 64,
      maxlength: 64,
    },

    dedupeKey: {
      type: String,
      required: true,
      minlength: 64,
      maxlength: 64,
    },

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

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    environment: {
      type: String,
      enum: ['production', 'development', 'test'],
      required: true,
    },

    path: {
      type: String,
      required: true,
      maxlength: 300,
    },

    viewedAt: {
      type: Date,
      required: true,
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

analyticsPageViewSchema.index(
  {
    environment: 1,
    eventKey: 1,
  },
  {
    unique: true,
  }
);

analyticsPageViewSchema.index(
  {
    environment: 1,
    dedupeKey: 1,
  },
  {
    unique: true,
  }
);

analyticsPageViewSchema.index({
  environment: 1,
  viewedAt: 1,
});

analyticsPageViewSchema.index({
  environment: 1,
  path: 1,
  viewedAt: 1,
});

analyticsPageViewSchema.index({
  environment: 1,
  visitorKey: 1,
  viewedAt: 1,
});

analyticsPageViewSchema.index({
  environment: 1,
  sessionKey: 1,
  viewedAt: -1,
});

analyticsPageViewSchema.index({
  userId: 1,
  viewedAt: -1,
});

analyticsPageViewSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

module.exports = mongoose.model(
  'AnalyticsPageView',
  analyticsPageViewSchema
);