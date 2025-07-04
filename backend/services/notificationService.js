const User = require('../models/User');

class NotificationService {
  constructor() {
    this.onlineUsers = new Map(); // userId -> socketId
  }

  addOnlineUser(userId, socketId) {
    this.onlineUsers.set(userId, socketId);
    console.log(`User ${userId} is now online with socket ${socketId}`);
  }

  removeOnlineUser(userId) {
    this.onlineUsers.delete(userId);
    console.log(`User ${userId} is now offline`);
  }

  getUserSocketId(userId) {
    return this.onlineUsers.get(userId);
  }

  getOnlineUsers() {
    return this.onlineUsers;
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  async notify(userId, type, message, link, io, senderId = null) {
    try {
      // For now, just emit to the user if they're online
      const socketId = this.getUserSocketId(userId);
      if (socketId) {
        io.to(socketId).emit('notification', {
          type,
          message,
          link,
          senderId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

module.exports = new NotificationService(); 