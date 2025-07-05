const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'POST_LIKE',
      'POST_COMMENT', 
      'ADOPTION_REQUEST',
      'ADOPTION_REQUEST_ACCEPTED',
      'ADOPTION_REQUEST_REJECTED',
      'NEW_POST_FOR_VETS'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  relatedAdoption: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adoption'
  },
  relatedAdoptionRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema); 