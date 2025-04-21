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
    required: true,
    index: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
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
    default: Date.now,
    index: true
  },
  responseDate: {
    type: Date
  },
  message: {
    type: String
  },
  // Add these new fields for better data tracking
  adopterName: {
    type: String
  },
  adopterEmail: {
    type: String
  },
  adopterPhone: {
    type: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
adoptionHistorySchema.index({ userId: 1, requestDate: -1 });
adoptionHistorySchema.index({ userId: 1, status: 1, requestDate: -1 });

adoptionHistorySchema.pre('save', function(next) {
  if (!this.userId || !mongoose.Types.ObjectId.isValid(this.userId)) {
    next(new Error('Invalid user ID'));
  } else {
    next();
  }
});

const AdoptionHistory = mongoose.model('AdoptionHistory', adoptionHistorySchema);

module.exports = AdoptionHistory;