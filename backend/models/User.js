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
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      default: null
    },
    authProviders: {
      type: [
        {
          provider: {
            type: String,
            enum: ['local', 'google'],
            required: true
          },
          providerId: {
            type: String,
            default: null
          },
          linkedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
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
      enum: ['incomplete', 'pending', 'verified', 'suspended'],
      default: 'incomplete'
    },
    sellerSince: {
      type: Date
    },
    notificationPreferences: {
      email: {
        type: String,
        enum: ['instant', 'daily_summary', 'disabled'],
        default: 'instant'
      },
      inApp: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: false
      }
    },
    canBuy: {
      type: Boolean,
      default: true
    }
  },
  {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
}
);

// DB-level uniqueness for non-empty phone numbers.
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string', $ne: '' } }
  }
);

// Prevent duplicate provider entries per user.
userSchema.index(
  { _id: 1, 'authProviders.provider': 1 },
  {
    unique: true,
    partialFilterExpression: { 'authProviders.provider': { $exists: true } }
  }
);

// Keep provider identity globally unique when present.
userSchema.index(
  { 'authProviders.provider': 1, 'authProviders.providerId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'authProviders.provider': { $exists: true },
      'authProviders.providerId': { $type: 'string', $ne: '' }
    }
  }
);

// Add a method to get user ID as string
userSchema.methods.getId = function() {
  return this._id.toString();
};

// BUG-005 FIX: Removed canBuy restrictions for sellers.
// Sellers now have instant access and their ability to buy is not gatekept by admin verification.
userSchema.pre('save', function(next) {
  if (this.isSeller) {
    // Set sellerSince timestamp on first activation
    if (!this.sellerSince) {
      this.sellerSince = new Date();
    }
  }
  // All users (including sellers) can buy
  this.canBuy = true;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
