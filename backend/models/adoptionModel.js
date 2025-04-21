const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: String,
    required: true
  },
  petType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  }
}, { timestamps: true });

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;