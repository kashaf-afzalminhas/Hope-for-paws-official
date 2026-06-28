const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    paymentDetails: {
      bankName: {
        type: String,
        required: true,
        trim: true
      },
      accountTitle: {
        type: String,
        required: true,
        trim: true
      },
      accountNumber: {
        type: String,
        required: true,
        trim: true
      }
    },
    profileImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'suspended'],
      default: 'pending'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Seller', sellerSchema);
