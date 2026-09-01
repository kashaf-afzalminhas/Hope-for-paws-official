const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
const Adoption = require('../models/adoptionModel');
const transporter = require('../config/emailTransporter');
const emailTemplates = require('../utils/emailTemplates');
const config = require('../config/notificationConfig');
const activityTracker = require('./activityTracker');
const { scheduleChatReminder } = require('../queues/chatEmailQueue');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map to store user ID to socket ID mapping

    this.transporter = transporter;
  }

  // Store user socket connection
  async addUserSocket(userId, socketId) {
    this.userSockets.set(userId.toString(), socketId);
    activityTracker.trackUserConnect(userId);
    try {
      await User.findByIdAndUpdate(
        userId,
        {
          status: 'online',
          lastActive: new Date()
        },
        { new: false }
      );
    } catch (error) {
      console.warn('Failed to update user activity on connect:', error.message);
    }
  }

  // Remove user socket connection
  async removeUserSocket(userId) {
    this.userSockets.delete(userId.toString());
    activityTracker.trackUserDisconnect(userId);
    try {
      await User.findByIdAndUpdate(
        userId,
        { status: 'offline' },
        { new: false }
      );
    } catch (error) {
      console.warn('Failed to update user status on disconnect:', error.message);
    }
  }

  // Track user heartbeat
  async trackUserHeartbeat(userId) {
    activityTracker.trackUserHeartbeat(userId);
    try {
      await User.findByIdAndUpdate(
        userId,
        { lastActive: new Date() },
        { new: false }
      );
    } catch (error) {
      console.warn('Failed to persist user heartbeat:', error.message);
    }
  }

  // Get socket ID for a user
  getUserSocket(userId) {
    return this.userSockets.get(userId.toString());
  }

  // Backward-compatible alias used in some handlers
  getUserSocketId(userId) {
    return this.getUserSocket(userId);
  }

  // Send real-time notification (no-op on Lambda when Socket.IO is disabled)
  async sendRealTimeNotification(userId, notificationData) {
    if (!this.io) return;
    const socketId = this.getUserSocket(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notificationData);
    }
  }

  // ---------------------------------------------------------------------
  // Centralized email-preference gate.
  //
  // This is the single source of truth for whether a recipient may be
  // emailed at all. Every function in this service that actually sends
  // mail (sendEmailNotification, sendChatDigestEmail, sendDailyDigestEmail)
  // must call this first, so that a user who has set
  // notificationPreferences.email = "disabled" can never receive an email
  // regardless of which code path (instant, digest, chat reminder, or a
  // direct call from outside this service) triggered it.
  //
  // `recipient` may be a full User doc, a lean object, or a partial
  // projection (e.g. `.select('email notificationPreferences')`) — it only
  // needs `email` and `notificationPreferences.email`.
  // ---------------------------------------------------------------------
  isEmailAllowedForRecipient(recipient) {
    if (!recipient || !recipient.email) return false;
    const preference = recipient.notificationPreferences?.email || 'instant';
    return preference !== 'disabled';
  }

  // ---------------------------------------------------------------------
  // Centralized in-app-delivery gate. Mirrors isEmailAllowedForRecipient:
  // both the per-notification channel flag AND the user's global
  // preference must allow it, or the real-time (socket) push is skipped.
  //
  // Note: this only gates the *live* push via sendRealTimeNotification.
  // The Notification document itself is always created and persisted
  // regardless of this preference (same as email, whose document is
  // always saved even when the message is only ever delivered via a
  // digest) — this preserves getUserNotifications/getUnreadCount/
  // markAsRead behavior exactly as it was before this change.
  //
  // If `recipient` couldn't be loaded (e.g. the user record is missing),
  // we deliberately default to allowing delivery rather than blocking it,
  // since that matches the prior behavior (the emit always fired) and we
  // have no explicit preference to enforce.
  // ---------------------------------------------------------------------
  isInAppDeliveryAllowed(recipient, notification) {
    const isInAppChannelEnabled = notification?.channels?.inApp !== false;
    if (!isInAppChannelEnabled) return false;
    if (!recipient) return true;
    return recipient.notificationPreferences?.inApp !== false;
  }

  // Create and send notification
  async createNotification(notificationData, { sendEmail = true } = {}) {
    try {
      const data = { ...notificationData };
      delete data.sendEmail; // safeguard

      const notification = new Notification(data);
      await notification.save();

      // Fetch the recipient once, up front — used to gate both the
      // real-time in-app push below and the email path further down.
      const recipient = await User.findById(notification.recipient).select('email notificationPreferences');

      // Send real-time (in-app) notification, respecting the channel flag
      // and the recipient's notificationPreferences.inApp setting.
      if (this.isInAppDeliveryAllowed(recipient, notification)) {
        await this.sendRealTimeNotification(notification.recipient, {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt,
          read: notification.read
        });
      }

      if (sendEmail && !notification.emailSent) {
        if (this.shouldSendEmailImmediately(recipient, notification)) {
          await this.sendEmailNotification(notification, recipient);
        } else {
          if (this.isEmailAllowedForRecipient(recipient)) {
            console.log(`Notification queued for digest for user ${recipient._id}`);
          }
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Decides whether this specific notification should be emailed *right now*,
  // as opposed to being left for a digest. This is an additional, narrower
  // check on top of isEmailAllowedForRecipient — it does NOT replace the
  // preference gate inside sendEmailNotification itself, since that method
  // can also be called directly from outside this function.
  shouldSendEmailImmediately(recipient, notification) {
    if (!this.isEmailAllowedForRecipient(recipient)) return false;
    if (notification.type === 'chat_message') return false;

    const preference = recipient.notificationPreferences?.email || 'instant';
    const isHighPriority = notification.priority === 'high';
    const isEmailChannelEnabled = notification.channels?.email !== false;

    if (!isEmailChannelEnabled) return false;
    if (isHighPriority) return true;
    return preference === 'instant';
  }

  async sendEmailNotification(notification, recipientOverride = null) {
    try {
      const recipient = recipientOverride || await User.findById(notification.recipient);

      // Preference gate lives here too (not just in shouldSendEmailImmediately)
      // so this method is safe to call directly from anywhere, now or in the future.
      if (!this.isEmailAllowedForRecipient(recipient)) {
        console.log(`Email notification skipped for user ${notification.recipient} (no email on file or email notifications disabled)`);
        return;
      }
      if (notification.type === 'chat_message') {
        return;
      }

      const { subject, html } = emailTemplates.buildNotificationEmail({
        title: notification.title,
        message: notification.message,
      });
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipient.email,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);

      // Update notification as email sent
      notification.emailSent = true;
      notification.emailSentAt = new Date();
      await notification.save();

      console.log(`Email notification sent to ${recipient.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Notification for post like
  async notifyPostLike(postId, likerId) {
    try {
      const post = await Post.findById(postId).populate('userId');
      if (!post || !post.userId) return;

      const liker = await User.findById(likerId);
      if (!liker) return;

      // Don't notify if user likes their own post
      if (post.userId._id.toString() === likerId.toString()) return;

      await this.createNotification({
        recipient: post.userId._id,
        sender: likerId,
        type: 'post_like',
        title: 'New Like on Your Post',
        message: `${liker.username} liked your post`,
        data: { postId: postId }
      });
    } catch (error) {
      console.error('Error notifying post like:', error);
    }
  }

  // Notification for post comment
  async notifyPostComment(postId, commenterId, commentId) {
    try {
      const post = await Post.findById(postId).populate('userId');
      if (!post || !post.userId) return;

      const commenter = await User.findById(commenterId);
      if (!commenter) return;

      // Don't notify if user comments on their own post
      if (post.userId._id.toString() === commenterId.toString()) return;

      await this.createNotification({
        recipient: post.userId._id,
        sender: commenterId,
        type: 'post_comment',
        title: 'New Comment on Your Post',
        message: `${commenter.username} commented on your post`,
        data: { postId: postId, commentId: commentId }
      });
    } catch (error) {
      console.error('Error notifying post comment:', error);
    }
  }

  // Notification for adoption request
  async notifyAdoptionRequest(adoptionId, requesterId, requestId) {
    try {
      const adoption = await Adoption.findById(adoptionId).populate('userId');
      if (!adoption || !adoption.userId) return;

      const requester = await User.findById(requesterId);
      if (!requester) return;

      await this.createNotification({
        recipient: adoption.userId._id,
        sender: requesterId,
        type: 'adoption_request',
        title: 'New Adoption Request',
        message: `${requester.username} has requested to adopt ${adoption.name}`,
        data: { adoptionId: adoptionId, adoptionRequestId: requestId }
      });
    } catch (error) {
      console.error('Error notifying adoption request:', error);
    }
  }

  // Notification for adoption request status change
  async notifyAdoptionRequestStatus(adoptionId, requesterId, status, adoptionName) {
    try {
      console.log('notifyAdoptionRequestStatus called with:', { adoptionId, requesterId, status, adoptionName });

      const requester = await User.findById(requesterId);
      if (!requester) return;

      const title = status === 'accepted'
        ? 'Adoption Request Accepted!'
        : 'Adoption Request Update';

      const message = status === 'accepted'
        ? `Congratulations! Your adoption request for ${adoptionName} has been accepted.`
        : `Your adoption request for ${adoptionName} has been ${status}.`;

      console.log('Creating notification with message:', message);

      await this.createNotification({
        recipient: requesterId,
        sender: null, // System notification
        type: status === 'accepted' ? 'adoption_request_accepted' : 'adoption_request_rejected',
        title: title,
        message: message,
        data: { adoptionId: adoptionId, adoptionName: adoptionName }
      });
    } catch (error) {
      console.error('Error notifying adoption request status:', error);
    }
  }

  // Notify all veterinarians about new post
  async notifyVetsNewPost(postId, postCaption, postCreatorId) {
    try {
      const vets = await User.find({ isVeterinarian: true });

      for (const vet of vets) {
        // Don't notify the post creator
        if (vet._id.toString() === postCreatorId.toString()) continue;

        await this.createNotification({
          recipient: vet._id,
          sender: null, // System notification
          type: 'new_post_vet_notification',
          title: 'New Community Post',
          message: `A new post has been shared in the community: "${postCaption.substring(0, 100)}${postCaption.length > 100 ? '...' : ''}"`,
          data: { postId: postId }
        });
      }
    } catch (error) {
      console.error('Error notifying vets about new post:', error);
    }
  }

  // Enhanced notification for chat message with delayed email digest reminders
  async notifyChatMessage(conversationId, messageId, senderId, messageText, recipientId) {
    try {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);

      if (!sender || !recipient) {
        console.log('Sender or recipient not found for chat message notification');
        return;
      }

      // Don't notify if user is messaging themselves
      if (senderId.toString() === recipientId.toString()) {
        return;
      }

      // Always create in-app notification
      await this.createNotification(
        {
          recipient: recipientId,
          sender: senderId,
          type: 'chat_message',
          title: `New message from ${sender.username}`,
          message: `"${messageText.length > config.MAX_MESSAGE_PREVIEW_LENGTH ? messageText.substring(0, config.MAX_MESSAGE_PREVIEW_LENGTH) + '...' : messageText}"`,
          data: {
            conversationId,
            messageId
          }
        },
        { sendEmail: false }
      );

      await scheduleChatReminder(recipientId);
      if (config.DEBUG_NOTIFICATIONS) {
        console.log(`⏰ Scheduled chat reminder job for user ${recipientId}`);
      }

    } catch (error) {
      console.error('Error notifying chat message:', error);
    }
  }

  async sendChatDigestEmail({ recipient, totalMessages, uniqueSenderNames, conversationCount, previewMessages }) {
    // Preference gate: chat digests go out from a queue worker, outside the
    // normal createNotification flow, so they need their own explicit check.
    if (!this.isEmailAllowedForRecipient(recipient)) {
      console.log(`Chat digest email skipped for user ${recipient?._id} (no email on file or email notifications disabled)`);
      return;
    }

    const { subject: mailSubject, html } = emailTemplates.buildChatDigestEmail({
      recipient,
      totalMessages,
      uniqueSenderNames,
      conversationCount,
      previewMessages,
    });
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipient.email,
      subject: mailSubject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(
      `Chat digest email sent to ${recipient.email} (${totalMessages} messages from ${uniqueSenderNames.length} senders)`
    );
  }

  async getPendingDigestNotifications(recipient) {
    if (!recipient?._id) return [];
    return Notification.find({
      recipient: recipient._id,
      'channels.email': true,
      emailSent: false,
      type: { $ne: 'chat_message' },
      priority: 'routine'
    })
      .sort({ createdAt: -1 })
      .limit(config.NOTIFICATION_DIGEST_BATCH_SIZE)
      .lean();
  }

  async sendDailyDigestEmail(recipient, notifications) {
    if (!notifications?.length) return;

    // Preference gate: defensive check in case this is ever called from a
    // path other than runDailyDigestJob's pre-filtered user query.
    if (!this.isEmailAllowedForRecipient(recipient)) {
      console.log(`Daily digest email skipped for user ${recipient?._id} (no email on file or email notifications disabled)`);
      return;
    }

    const { subject, html } = emailTemplates.buildDailyDigestEmail({
      recipient,
      notifications,
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipient.email,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
    await Notification.updateMany(
      { _id: { $in: notifications.map(n => n._id) } },
      { $set: { emailSent: true, emailSentAt: new Date() } }
    );

    console.log(`Daily digest email sent to ${recipient.email} (${notifications.length} notifications)`);
  }

  async runDailyDigestJob() {
    try {
      const users = await User.find({
        'notificationPreferences.email': 'daily_summary',
        email: { $exists: true, $ne: '' }
      }).select('email notificationPreferences');

      for (const user of users) {
        const pendingNotifications = await this.getPendingDigestNotifications(user);
        if (!pendingNotifications.length) continue;
        await this.sendDailyDigestEmail(user, pendingNotifications);
      }
    } catch (error) {
      console.error('Error running daily digest job:', error);
    }
  }

  scheduleDailyDigestJob() {
    const hour = config.NOTIFICATION_DAILY_DIGEST_HOUR;
    const minute = config.NOTIFICATION_DAILY_DIGEST_MINUTE;

    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(hour, minute, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun - now;
    setTimeout(async () => {
      await this.runDailyDigestJob();
      setInterval(() => this.runDailyDigestJob(), 24 * 60 * 60 * 1000);
    }, delay);

    console.log(`Scheduled daily digest job at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} local time`);
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipient: userId,
        read: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;