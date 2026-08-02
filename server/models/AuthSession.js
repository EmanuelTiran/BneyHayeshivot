const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

authSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

authSessionSchema.index({ userId: 1, lastUsedAt: -1 });

module.exports = mongoose.model(
  'AuthSession',
  authSessionSchema
);
