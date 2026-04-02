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

// Add a method to get user ID as string
userSchema.methods.getId = function() {
  return this._id.toString();
};

// Keep buying permission aligned with seller role
userSchema.pre('save', function(next) {
  if (this.isSeller) {
    this.canBuy = false;
    if (!this.sellerSince) {
      this.sellerSince = new Date();
    }
  } else {
    this.canBuy = true;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
