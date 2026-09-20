const mongoose = require('mongoose');

const shippingPolicySchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  coverage: {
    mode: {
      type: String,
      enum: ['NATIONWIDE', 'SELECTED_AREAS', 'LOCAL_DELIVERY', 'PICKUP'],
      required: true
    },
    areas: {
      type: [String],
      default: []
    }
  },
  rates: [{
    zone: {
      type: String,
      enum: ['LOCAL', 'NATIONWIDE', 'PICKUP', 'OTHER'],
      required: true
    },
    fee: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  shippingFee: {
    type: Number,
    min: 0
  },
  freeShippingThreshold: {
    type: Number,
    min: 0,
    default: null
  },
  processingTime: {
    minDays: { type: Number, required: true, min: 0 },
    maxDays: { type: Number, required: true, min: 0 }
  },
  transitTime: {
    minDays: { type: Number, required: true, min: 0 },
    maxDays: { type: Number, required: true, min: 0 }
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

shippingPolicySchema.index({ sellerId: 1, createdAt: -1 });
shippingPolicySchema.index({ sellerId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

module.exports = mongoose.model('ShippingPolicy', shippingPolicySchema);
