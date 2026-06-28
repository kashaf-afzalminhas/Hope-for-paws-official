const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isVeterinarian: { type: Boolean, default: false },
  phone: { type: String, required: true },
  
  // ✅ ADDED: Fields to store Seller info temporarily
  userType: { type: String, enum: ['user', 'seller'], default: 'user' },

  verificationCode: { type: String, required: true },
  verificationCodeExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Documents expire after 1 hour
});

module.exports = mongoose.model('TempUser', tempUserSchema);