const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

class NotificationService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map to store user ID to socket ID
  }

  // Register user socket connection
  registerUser(userId, socketId) {
    this.userSockets.set(userId, socketId);
  }

  // Remove user socket connection
  removeUser(userId) {
    this.userSockets.delete(userId);
  }

  // Send real-time notification
  sendRealTimeNotification(userId, notification) {
    const socketId = this.userSockets.get(userId);
    console.log('📡 Sending real-time notification to user:', userId);
    console.log('📡 Socket ID found:', !!socketId);
    
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
      console.log('✅ Real-time notification sent to socket:', socketId);
    } else {
      console.log('⚠️  User not connected to socket:', userId);
    }
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      console.log('🔔 Creating notification:', {
        type: notificationData.type,
        recipient: notificationData.recipient,
        title: notificationData.title
      });

      const notification = new Notification(notificationData);
      await notification.save();

      console.log('✅ Notification saved to database:', notification._id);

      // Send real-time notification
      this.sendRealTimeNotification(notificationData.recipient, notification);

      // Send email notification if not already sent
      if (!notificationData.emailSent) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const recipient = await User.findById(notification.recipient);
      if (!recipient || !recipient.email) {
        console.log('No email found for user:', notification.recipient);
        return;
      }

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipient.email,
        subject: notification.title,
        html: this.generateEmailTemplate(notification)
      };

      await transporter.sendMail(mailOptions);
      
      // Mark email as sent
      notification.emailSent = true;
      await notification.save();
      
      console.log('Email notification sent to:', recipient.email);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Generate email template
  generateEmailTemplate(notification) {
    const baseUrl = process.env.FRONTEND_URL || 'https://www.hopeforpaws.club';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f4ed; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #6b493d; margin-bottom: 10px;">🐾 Hope for Paws</h1>
          <h2 style="color: #4E3B31; margin-bottom: 20px;">${notification.title}</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <p style="color: #4E3B31; font-size: 16px; line-height: 1.6;">${notification.message}</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${baseUrl}" 
               style="background-color: #6b493d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View on Website
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #8B5A2B; font-size: 14px;">
          <p>Thank you for being part of our community!</p>
          <p>You can manage your notification preferences in your account settings.</p>
        </div>
      </div>
    `;
  }

  // Notification methods for different types
  async notifyPostLike(post, liker) {
    if (post.userId.toString() === liker._id.toString()) return; // Don't notify self

    const notification = await this.createNotification({
      recipient: post.userId,
      sender: liker._id,
      type: 'POST_LIKE',
      title: 'New Like on Your Post',
      message: `${liker.username} liked your post`,
      relatedPost: post._id,
      metadata: {
        postCaption: post.caption?.substring(0, 50) + (post.caption?.length > 50 ? '...' : '')
      }
    });

    return notification;
  }

  async notifyPostComment(post, comment, commenter) {
    if (post.userId.toString() === commenter._id.toString()) return; // Don't notify self

    const notification = await this.createNotification({
      recipient: post.userId,
      sender: commenter._id,
      type: 'POST_COMMENT',
      title: 'New Comment on Your Post',
      message: `${commenter.username} commented on your post: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
      relatedPost: post._id,
      metadata: {
        commentContent: comment.content,
        postCaption: post.caption?.substring(0, 50) + (post.caption?.length > 50 ? '...' : '')
      }
    });

    return notification;
  }

  async notifyAdoptionRequest(adoption, requester) {
    const notification = await this.createNotification({
      recipient: adoption.userId,
      sender: requester._id,
      type: 'ADOPTION_REQUEST',
      title: 'New Adoption Request',
      message: `${requester.username} wants to adopt ${adoption.name}`,
      relatedAdoption: adoption._id,
      relatedAdoptionRequest: requester._id,
      metadata: {
        petName: adoption.name,
        petType: adoption.petType
      }
    });

    return notification;
  }

  async notifyAdoptionRequestResponse(adoptionRequest, adoption, accepted) {
    const notification = await this.createNotification({
      recipient: adoptionRequest.userId,
      sender: adoption.userId,
      type: accepted ? 'ADOPTION_REQUEST_ACCEPTED' : 'ADOPTION_REQUEST_REJECTED',
      title: accepted ? 'Adoption Request Accepted!' : 'Adoption Request Update',
      message: accepted 
        ? `Great news! Your adoption request for ${adoption.name} has been accepted. Please contact the owner to arrange pickup.`
        : `Your adoption request for ${adoption.name} was not accepted at this time.`,
      relatedAdoption: adoption._id,
      relatedAdoptionRequest: adoptionRequest._id,
      metadata: {
        petName: adoption.name,
        petType: adoption.petType,
        status: accepted ? 'accepted' : 'rejected'
      }
    });

    return notification;
  }

  async notifyVetsNewPost(post, poster) {
    try {
      // Find all veterinarians
      const vets = await User.find({ isVeterinarian: true });
      
      const notifications = await Promise.all(
        vets.map(vet => 
          this.createNotification({
            recipient: vet._id,
            sender: poster._id,
            type: 'NEW_POST_FOR_VETS',
            title: 'New Community Post Requires Attention',
            message: `${poster.username} posted: "${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}"`,
            relatedPost: post._id,
            metadata: {
              postCaption: post.caption,
              posterUsername: poster.username
            }
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error notifying vets:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username')
      .populate('relatedPost', 'caption imageUrl')
      .populate('relatedAdoption', 'name petType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    return {
      notifications,
      total,
      unreadCount,
      hasMore: skip + notifications.length < total
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    return notification;
  }
}

module.exports = NotificationService; 