const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 4,
      maxlength: 16,
      match: [/^[A-Z0-9]{4,16}$/, 'Must be 4–16 alphanumeric characters.'],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    sellerStoreName: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      enum: ['WHOLE_STORE', 'SPECIFIC_CATEGORY'],
      default: 'WHOLE_STORE',
    },
    applicableCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    discountMechanism: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'CUSTOM_REWARD'],
      required: true,
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    customRewardText: {
      type: String,
      trim: true,
      default: null,
    },
    maxDiscountCap: {
      type: Number,
      default: null,
    },
    minSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDatetime: {
      type: Date,
      required: true,
    },
    endDatetime: {
      type: Date,
      required: true,
    },
    totalUsageLimit: {
      type: Number,
      default: null,
    },
    perBuyerLimit: {
      type: Number,
      default: 1,
    },
    totalRedemptions: {
      type: Number,
      default: 0,
    },
    userRedemptions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

promoCodeSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);