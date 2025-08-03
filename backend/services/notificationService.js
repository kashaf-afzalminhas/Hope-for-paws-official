const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
const Adoption = require('../models/adoptionModel');
const nodemailer = require('nodemailer');

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
  addUserSocket(userId, socketId) {
    this.userSockets.set(userId.toString(), socketId);
  }

  // Remove user socket connection
  removeUserSocket(userId) {
    this.userSockets.delete(userId.toString());
  }

  // Get socket ID for a user
  getUserSocket(userId) {
    return this.userSockets.get(userId.toString());
  }

  // Send real-time notification
  async sendRealTimeNotification(userId, notificationData) {
    const socketId = this.getUserSocket(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notificationData);
    }
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send real-time notification
      await this.sendRealTimeNotification(notificationData.recipient, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
        read: notification.read
      });

      // Send email notification if not already sent
      if (!notification.emailSent) {
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