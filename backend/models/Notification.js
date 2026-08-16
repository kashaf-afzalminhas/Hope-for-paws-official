const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for system notifications
  },
  type: {
    type: String,
    enum: [
      'post_like',
      'post_comment',
      'adoption_request',
      'adoption_request_accepted',
      'adoption_request_rejected',
      // Added: used by adoptionRoutes.js's reopenListingRequestsForAvailability()
      // when a listing goes adopted -> available and a previously
      // accepted/rejected request is reset to pending. Without this value,
      // Notification.save() throws a ValidationError that was being silently
      // swallowed, so the requester was never notified.
      'adoption_request_pending',
      'new_post_vet_notification',
      'chat_message',
      'new_order',
      'payment_confirmed',
      'refund_request',
      'order_status_update',
      'system'
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
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'routine'],
    default: 'routine'
  },
  channels: {
    email: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;