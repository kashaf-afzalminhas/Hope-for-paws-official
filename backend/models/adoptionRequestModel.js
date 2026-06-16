
const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adoption',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  petHistoryImage: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

adoptionRequestSchema.index({ adId: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
