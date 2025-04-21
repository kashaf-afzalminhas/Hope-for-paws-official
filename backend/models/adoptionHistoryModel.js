const mongoose = require('mongoose');

const adoptionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adoption',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  petName: {
    type: String,
    required: true
  },
  petType: {
    type: String,
    required: true
  },
  petImage: {
    type: String,
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  message: {
    type: String
  }
}, { timestamps: true });

adoptionHistorySchema.pre('save', function(next) {
  if (!this.userId || !mongoose.Types.ObjectId.isValid(this.userId)) {
    next(new Error('Invalid user ID'));
  } else {
    next();
  }
});

const AdoptionHistory = mongoose.model('AdoptionHistory', adoptionHistorySchema);

module.exports = AdoptionHistory; 