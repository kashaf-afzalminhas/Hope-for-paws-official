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
  breed: {
    type: String,
    required: true
  },
  vaccinated: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  neuteredSpayed: {
    type: String,
    enum: ['Yes', 'No'],
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
  },
  requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest'
  }],
  location: {
    type: String,
    required: true,
    default: 'Location not specified'
  }
}, { timestamps: true });

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;