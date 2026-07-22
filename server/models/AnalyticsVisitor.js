const mongoose = require('mongoose');

const analyticsVisitorSchema = new mongoose.Schema(
  {
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
    firstSeenAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
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

analyticsVisitorSchema.index(
  {
    environment: 1,
    visitorKey: 1,
  },
  {
    unique: true,
  }
);

analyticsVisitorSchema.index({
  environment: 1,
  firstSeenAt: 1,
});

analyticsVisitorSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

module.exports = mongoose.model(
  'AnalyticsVisitor',
  analyticsVisitorSchema
);