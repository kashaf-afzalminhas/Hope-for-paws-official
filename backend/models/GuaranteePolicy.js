const mongoose = require('mongoose');

const guaranteePolicySchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['QUALITY_GUARANTEE', 'SELLER_WARRANTY', 'MANUFACTURER_WARRANTY', 'OTHER'],
    required: true
  },
  customType: {
    type: String,
    trim: true,
    default: '',
    maxlength: 120
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  durationUnit: {
    type: String,
    enum: ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

guaranteePolicySchema.index({ sellerId: 1, createdAt: -1 });
guaranteePolicySchema.index({ sellerId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

module.exports = mongoose.model('GuaranteePolicy', guaranteePolicySchema);
