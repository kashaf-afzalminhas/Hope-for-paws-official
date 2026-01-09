const mongoose = require('mongoose');

const TempUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVeterinarian: { type: Boolean, default: false },
  phone: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verificationCodeExpires: { type: Date, required: true },
  // Seller registration fields (only if userType is 'seller')
  userType: { 
    type: String, 
    enum: ['user', 'seller'], 
    default: 'user',
    required: false
  },
  sellerName: { type: String, required: false }, // Required if userType is 'seller'
  cnic: { type: String, required: false }, // Required if userType is 'seller'
  location: { type: String, required: false }, // Required if userType is 'seller'
});

module.exports = mongoose.model('TempUser', TempUserSchema);