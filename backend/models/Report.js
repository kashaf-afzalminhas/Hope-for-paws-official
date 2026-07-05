const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Prevent a user from reporting the same product multiple times
reportSchema.index({ reporter: 1, targetProduct: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
