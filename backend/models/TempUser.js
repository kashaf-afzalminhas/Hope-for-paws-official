const mongoose = require('mongoose');

const TempUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVeterinarian: { type: Boolean, default: false },
  verificationCode: { type: String, required: true },
  verificationCodeExpires: { type: Date, required: true },
});

module.exports = mongoose.model('TempUser', TempUserSchema);