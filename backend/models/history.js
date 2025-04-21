const mongoose = require('mongoose');

const adoptionHistorySchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  animalName: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Rejected', 'Accepted'],
    default: 'Pending',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const AdoptionHistory = mongoose.model('AdoptionHistory', adoptionHistorySchema);

module.exports = AdoptionHistory;