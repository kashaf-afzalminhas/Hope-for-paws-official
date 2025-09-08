const notificationService = require('./notificationService');
const User = require('../models/User');

const socketHandler = (io, socket) => {
  // Handle user connection
  socket.on('join', (userId) => {
    try {
      // Add user to online users
      notificationService.addOnlineUser(userId, socket.id);
      
      // Join user's personal room
      socket.join(userId);
      
      console.log(`User ${userId} joined with socket ${socket.id}`);
    } catch (error) {
      console.error('Error in join:', error);
    }
  });

  // Handle joining conversation room
  socket.on('joinConversation', (conversationId) => {
    try {
      console.log(`User ${socket.id} joining conversation room: ${conversationId}`);
      socket.join(conversationId.toString());
      console.log(`User successfully joined conversation room: ${conversationId}`);
      
      // Log all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      console.log(`Socket ${socket.id} is now in rooms:`, rooms);
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  });

  // Handle leaving conversation room
  socket.on('leaveConversation', (conversationId) => {
    try {
      console.log(`User ${socket.id} leaving conversation room: ${conversationId}`);
      socket.leave(conversationId.toString());
      console.log(`User successfully left conversation room: ${conversationId}`);
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    try {
      // Find and remove user from online users
      for (const [userId, socketId] of notificationService.onlineUsers.entries()) {
        if (socketId === socket.id) {
          notificationService.removeOnlineUser(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });

  // Handle markMessageAsRead event
  socket.on('markMessageAsRead', async (data) => {
    try {
      const { messageId, userId, conversationId } = data;
      console.log('Marking message as read:', { messageId, userId, conversationId });
      
      // Emit to conversation room that message was read
      if (conversationId) {
        io.to(conversationId.toString()).emit('messageRead', { 
          messageId, 
          userId,
          conversationId 
        });
      }
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  });

  // Handle user typing
  socket.on('userTyping', (data) => {
    try {
      const { userId, conversationId, isTyping } = data;
      
      // Emit to other users in the conversation
      socket.to(conversationId.toString()).emit('userTyping', {
        userId,
        conversationId,
        isTyping
      });
    } catch (error) {
      console.error('Error in userTyping:', error);
    }
  });

  // Handle new message (legacy event)
  socket.on('message:new', async (data) => {
    try {
      const { senderId, receiverId, message } = data;
      
      // Emit to receiver if online
      const receiverSocketId = notificationService.getUserSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:received', {
          senderId,
          message
        });
      }

      // Create notification
      await notificationService.notify(
        receiverId,
        'message',
        message,
        `/messages/${senderId}`,
        io,
        senderId
      );
    } catch (error) {
      console.error('Error in message:new:', error);
    }
  });

  // Handle new bid
  socket.on('bid:new', async (data) => {
    try {
      const { jobId, freelancerId, clientId, bidAmount } = data;
      
      // Emit to client if online
      const clientSocketId = notificationService.getUserSocketId(clientId);
      if (clientSocketId) {
        io.to(clientSocketId).emit('bid:received', {
          jobId,
          freelancerId,
          bidAmount
        });
      }

      // Create notification
      await notificationService.notify(
        clientId,
        'bid',
        `New bid of $${bidAmount} received for your job`,
        `/jobs/${jobId}`,
        io
      );
    } catch (error) {
      console.error('Error in bid:new:', error);
    }
  });

  // Handle job hired
  socket.on('job:hired', async (data) => {
    try {
      const { jobId, freelancerId, clientId } = data;
      
      // Emit to freelancer if online
      const freelancerSocketId = notificationService.getUserSocketId(freelancerId);
      if (freelancerSocketId) {
        io.to(freelancerSocketId).emit('job:hired:received', {
          jobId,
          clientId
        });
      }

      // Create notification
      await notificationService.notify(
        freelancerId,
        'job_hired',
        'You have been hired for a job!',
        `/jobs/${jobId}`,
        io
      );
    } catch (error) {
      console.error('Error in job:hired:', error);
    }
  });

  // Handle work submission
  socket.on('work:submitted', async (data) => {
    try {
      const { jobId, freelancerId, clientId } = data;
      
      // Emit to client if online
      const clientSocketId = notificationService.getUserSocketId(clientId);
      if (clientSocketId) {
        io.to(clientSocketId).emit('work:submitted:received', {
          jobId,
          freelancerId
        });
      }

      // Create notification
      await notificationService.notify(
        clientId,
        'work_submitted',
        'Work has been submitted for your review',
        `/jobs/${jobId}`,
        io
      );
    } catch (error) {
      console.error('Error in work:submitted:', error);
    }
  });

  // Handle work approval
  socket.on('work:approved', async (data) => {
    try {
      const { jobId, freelancerId, clientId } = data;
      
      // Emit to freelancer if online
      const freelancerSocketId = notificationService.getUserSocketId(freelancerId);
      if (freelancerSocketId) {
        io.to(freelancerSocketId).emit('work:approved:received', {
          jobId,
          clientId
        });
      }

      // Create notification
      await notificationService.notify(
        freelancerId,
        'work_approved',
        'Your work has been approved!',
        `/jobs/${jobId}`,
        io
      );
    } catch (error) {
      console.error('Error in work:approved:', error);
    }
  });
};

module.exports = socketHandler;

