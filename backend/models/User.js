const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    isVeterinarian: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      default: ""
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    phoneVerificationCode: {
      type: String
    },
    phoneVerificationCodeExpires: {
      type: Date
    },
    city: {
      type: String,
      default: ""
    },
    about: {
      type: String,
      default: ""
    },
    profileImage: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline'
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    lastChatEmailSentAt: {
      type: Date
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    verificationCode: {
      type: String
    },
    verificationCodeExpires: {
      type: Date
    },
    // Seller fields
    isSeller: {
      type: Boolean,
      default: false
    },
    sellerStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspended'],
      default: 'pending'
    },
    sellerSince: {
      type: Date
    },
    canBuy: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// DB-level uniqueness for non-empty phone numbers.
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string', $ne: '' } }
  }
);

// Add a method to get user ID as string
userSchema.methods.getId = function() {
  return this._id.toString();
};

// BUG-005 FIX: Do not force canBuy=false for all sellers.
// canBuy is managed by the admin via sellerController (based on sellerStatus).
// Only restore canBuy=true when the isSeller flag is removed.
userSchema.pre('save', function(next) {
  if (this.isSeller) {
    // Set sellerSince timestamp on first activation
    if (!this.sellerSince) {
      this.sellerSince = new Date();
    }
    // canBuy is intentionally NOT overridden here — let the controller manage it
  } else {
    // Regular user: can always buy
    this.canBuy = true;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
