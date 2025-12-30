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
    }
  },
  { timestamps: true }
);

// Add a method to get user ID as string
userSchema.methods.getId = function() {
  return this._id.toString();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
