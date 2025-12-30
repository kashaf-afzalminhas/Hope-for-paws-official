const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
const Adoption = require('../models/adoptionModel');
const nodemailer = require('nodemailer');
const config = require('../config/notificationConfig');
const activityTracker = require('./activityTracker');
const { scheduleChatReminder } = require('../queues/chatEmailQueue');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map to store user ID to socket ID mapping
    
    // Email transporter setup
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
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

  // Send real-time notification
  async sendRealTimeNotification(userId, notificationData) {
    const socketId = this.getUserSocket(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notificationData);
    }
  }

  // Create and send notification
  async createNotification(notificationData, { sendEmail = true } = {}) {
    try {
      const data = { ...notificationData };
      delete data.sendEmail; // safeguard

      const notification = new Notification(data);
      await notification.save();

      // Send real-time notification
      await this.sendRealTimeNotification(notification.recipient, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
        read: notification.read
      });

      // Send email notification if explicitly allowed
      if (sendEmail && !notification.emailSent) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const recipient = await User.findById(notification.recipient);
      if (!recipient || !recipient.email) {
        console.log('No recipient or email found for notification:', notification._id);
        return;
      }
      if (notification.type === 'chat_message') {
        return;
      }

          const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipient.email,
      subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #6b493d; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Hope for Paws</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2 style="color: #6b493d;">${notification.title}</h2>
              <p style="color: #333; line-height: 1.6;">${notification.message}</p>
              <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid #6b493d;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  This is an automated notification from Hope for Paws. 
                  You can manage your notification preferences in your account settings.
                </p>
              </div>
            </div>
            <div style="background-color: #f5f3ed; padding: 15px; text-align: center; color: #666; font-size: 12px;">
              <p>© 2024 Hope for Paws. All rights reserved.</p>
            </div>
          </div>
        `
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
    if (!recipient?.email) {
      console.log('No recipient email provided for chat digest');
      return;
    }

    const senderSummary =
      uniqueSenderNames.length === 1
        ? uniqueSenderNames[0]
        : `${uniqueSenderNames.length} contacts`;

    const subject =
      totalMessages === 1
        ? `New message from ${senderSummary} - Hope for Paws`
        : `You have ${totalMessages} new messages - Hope for Paws`;

    const previewHtml = previewMessages
      .map(
        (msg) => `
        <div style="margin-bottom: 12px; padding: 12px; background-color: #ffffff; border-radius: 10px; border-left: 4px solid #6b493d;">
          <p style="margin: 0; font-weight: bold; color: #6b493d;">${msg.senderName}</p>
          <p style="margin: 6px 0 0 0; color: #333; line-height: 1.6;">${msg.text}</p>
        </div>
      `
      )
      .join('');

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipient.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background-color: #6b493d; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Hope for Paws</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9;">You have new messages waiting</p>
          </div>
          <div style="padding: 24px; background-color: #f9f9f9; border-radius: 0 0 12px 12px;">
            <p style="color: #333; line-height: 1.6;">
              You have <strong>${totalMessages} unread message${totalMessages === 1 ? '' : 's'}</strong> from <strong>${uniqueSenderNames.length} contact${uniqueSenderNames.length === 1 ? '' : 's'}</strong> across <strong>${conversationCount} conversation${conversationCount === 1 ? '' : 's'}</strong>.
            </p>
            <div style="margin-top: 24px;">
              ${previewHtml}
            </div>
            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="${process.env.FRONTEND_URL || 'https://hope-for-paws-official.vercel.app'}/chat"
                 style="background-color: #6b493d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; display: inline-block; font-weight: bold;">
                Open Chat
              </a>
            </div>
            <p style="margin: 0; color: #666; font-size: 13px; text-align: center;">
              We'll only email you if you miss messages for a while.
            </p>
          </div>
          <div style="background-color: #f5f3ed; padding: 16px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 12px 12px;">
            <p>© 2024 Hope for Paws. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
    console.log(
      `Chat digest email sent to ${recipient.email} (${totalMessages} messages from ${uniqueSenderNames.length} senders)`
    );
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