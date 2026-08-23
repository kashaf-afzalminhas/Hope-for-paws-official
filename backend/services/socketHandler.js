const User = require('../models/User');
const activityTracker = require('./activityTracker');

const setupSocketHandlers = (io, socket, notificationService) => {
  console.log(`🔧 Setting up socket handlers for socket: ${socket.id}, user: ${socket.userId}`);
  
  // Test handler to verify socket handlers are working
  socket.on('testHandler', (data) => {
    console.log(`🧪 Test handler received:`, data);
    socket.emit('testHandlerResponse', { received: true, timestamp: new Date().toISOString() });
  });
  
  // Handle user connection
 // Handle user connection
socket.on('join', async (userId) => {
  try {
  
    if (!socket.userId) {
      console.error('join event received but socket has no authenticated userId');
      return;
    }

    if (userId && userId !== socket.userId) {
      console.warn(`Client-sent join userId (${userId}) does not match authenticated socket.userId (${socket.userId}) — using socket.userId`);
    }

    // Re-affirm registration (harmless if already set in app.js) and
    // join the personal room, both keyed by the trusted id.
    await notificationService.addUserSocket(socket.userId, socket.id);
    socket.join(socket.userId);

    console.log(`User ${socket.userId} joined with socket ${socket.id}`);
  } catch (error) {
    console.error('Error in join:', error);
  }
});

  // Handle user heartbeat for activity tracking
  socket.on('heartbeat', async (userId) => {
    if (userId && typeof userId === 'string') {
      try {
        await notificationService.trackUserHeartbeat(userId);
      } catch (error) {
        console.error('Error in heartbeat:', error);
      }
    }
  });

  // Handle joining conversation room
  socket.on('joinConversation', (conversationId) => {
    try {
      // Validate conversationId
      if (!conversationId) {
        console.error('Invalid conversationId received:', conversationId);
        return;
      }
      
      console.log(`🔗 User ${socket.id} joining conversation room: ${conversationId}`);
      console.log(`🔗 Socket userId:`, socket.userId);
      console.log(`🔗 Socket authenticated:`, !!socket.userId);
      
      socket.join(conversationId.toString());
      console.log(`✅ User successfully joined conversation room: ${conversationId}`);
      
      // Log all rooms this socket is in
      const rooms = Array.from(socket.rooms);
      console.log(`📋 Socket ${socket.id} is now in rooms:`, rooms);
      
      // Verify the room was created and socket is in it
      const roomSockets = io.sockets.adapter.rooms.get(conversationId.toString());
      console.log(`📋 Room ${conversationId} now has ${roomSockets ? roomSockets.size : 0} sockets`);
      
      // Send confirmation to the client that they successfully joined the room
      socket.emit('roomJoined', {
        conversationId: conversationId.toString(),
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error joining conversation:', error);
    }
  });

  // Handle leaving conversation room
  socket.on('leaveConversation', (conversationId) => {
    try {
      // Validate conversationId
      if (!conversationId) {
        console.error('Invalid conversationId received:', conversationId);
        return;
      }
      
      console.log(`User ${socket.id} leaving conversation room: ${conversationId}`);
      socket.leave(conversationId.toString());
      console.log(`User successfully left conversation room: ${conversationId}`);
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  });

  // Handle test message
  socket.on('testMessage', (data) => {
    try {
      console.log('🧪 Received test message:', data);
      const { conversationId, senderId, text } = data;
      
      if (!conversationId || !senderId || !text) {
        console.error('Invalid test message data:', data);
        return;
      }
      
      // Check if socket is in the conversation room
      const rooms = Array.from(socket.rooms);
      console.log('🧪 Socket is in rooms:', rooms);
      console.log('🧪 Target conversation room:', conversationId.toString());
      console.log('🧪 Is socket in target room?', rooms.includes(conversationId.toString()));
      
      // Echo the test message back to the conversation room
      const messageData = {
        _id: 'test-' + Date.now(),
        conversationId: conversationId.toString(),
        senderId: senderId.toString(),
        text: text,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      
      io.to(conversationId.toString()).emit("newMessage", messageData);
      console.log('🧪 Test message echoed back to conversation room:', conversationId);
      
      // Also check room occupancy
      const roomSockets = io.sockets.adapter.rooms.get(conversationId.toString());
      console.log('🧪 Room has', roomSockets ? roomSockets.size : 0, 'sockets');
    } catch (error) {
      console.error('Error handling test message:', error);
    }
  });

  // Handle debug event to test socket handler registration
  socket.on('debugSocket', (data) => {
    try {
      console.log('🔧 Debug socket event received:', data);
      console.log('🔧 Socket ID:', socket.id);
      console.log('🔧 Socket userId:', socket.userId);
      console.log('🔧 Socket rooms:', Array.from(socket.rooms));
      
      // Echo back to confirm the event was received
      socket.emit('debugSocketResponse', {
        socketId: socket.id,
        userId: socket.userId,
        rooms: Array.from(socket.rooms),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling debug socket:', error);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    try {
      // Find and remove user from online users
      for (const [userId, socketId] of notificationService.userSockets.entries()) {
        if (socketId === socket.id) {
          notificationService.removeUserSocket(userId);
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
      
      // Validate data
      if (!messageId || !userId || !conversationId) {
        console.error('Invalid markMessageAsRead data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!userId || !conversationId || typeof isTyping !== 'boolean') {
        console.error('Invalid userTyping data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!senderId || !receiverId || !message) {
        console.error('Invalid message:new data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!jobId || !freelancerId || !clientId || !bidAmount) {
        console.error('Invalid bid:new data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!jobId || !freelancerId || !clientId) {
        console.error('Invalid job:hired data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!jobId || !freelancerId || !clientId) {
        console.error('Invalid work:submitted data:', data);
        return;
      }
      
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
      
      // Validate data
      if (!jobId || !freelancerId || !clientId) {
        console.error('Invalid work:approved data:', data);
        return;
      }
      
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

module.exports = { setupSocketHandlers };

