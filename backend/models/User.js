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
    city: {
      type: String,
      default: ""
    },
    about: {
      type: String,
      default: ""
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
