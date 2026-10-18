const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Legacy/test socket events (testHandler, testMessage, debugSocket, message:new, bid:new,
// job:hired, work:submitted, work:approved) trusted IDs sent by the client and are not used
// by the frontend. They are kept but disabled unless this env flag is set.
const LEGACY_EVENTS_ENABLED = process.env.ENABLE_LEGACY_SOCKET_EVENTS === 'true';

// Returns true if the authenticated socket user is a participant of the conversation
const isConversationMember = async (conversationId, userId) => {
  if (!conversationId || !userId || !mongoose.Types.ObjectId.isValid(String(conversationId))) {
    return false;
  }
  const found = await Conversation.exists({ _id: String(conversationId), participants: userId });
  return !!found;
};

const setupSocketHandlers = (io, socket, notificationService) => {
  // Join the personal room. The room is always the authenticated user's id; any id sent by the client is ignored.
  socket.on('join', async () => {
    try {
      if (!socket.userId) return;
      socket.join(socket.userId);
    } catch (error) {
      console.error('Error in join:', error);
    }
  });

  // Activity heartbeat for the authenticated user only
  socket.on('heartbeat', async () => {
    if (!socket.userId) return;
    try {
      await notificationService.trackUserHeartbeat(socket.userId);
    } catch (error) {
      console.error('Error in heartbeat:', error);
    }
  });

  // Join a conversation room, only if the user is a participant of that conversation
  socket.on('joinConversation', async (conversationId) => {
    try {
      const id = conversationId ? conversationId.toString() : '';
      if (!(await isConversationMember(id, socket.userId))) {
        socket.emit('roomJoined', { conversationId: id, success: false });
        return;
      }
      socket.join(id);
      socket.emit('roomJoined', {
        conversationId: id,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  });

  socket.on('leaveConversation', (conversationId) => {
    try {
      if (!conversationId) return;
      const id = conversationId.toString();
      // Never leave the personal room through this event
      if (id === socket.userId) return;
      socket.leave(id);
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  });

  // Read receipt broadcast (sender is always the authenticated user)
  socket.on('markMessageAsRead', async (data) => {
    try {
      const { messageId, conversationId } = data || {};
      if (!messageId || !conversationId) return;
      if (!(await isConversationMember(conversationId, socket.userId))) return;
      socket.to(conversationId.toString()).emit('messageRead', {
        messageId,
        userId: socket.userId,
        conversationId
      });
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
    }
  });

  // Typing indicator (sender is always the authenticated user)
  socket.on('userTyping', async (data) => {
    try {
      const { conversationId, isTyping } = data || {};
      if (!conversationId || typeof isTyping !== 'boolean') return;
      if (!(await isConversationMember(conversationId, socket.userId))) return;
      socket.to(conversationId.toString()).emit('userTyping', {
        userId: socket.userId,
        conversationId,
        isTyping
      });
    } catch (error) {
      console.error('Error in userTyping:', error);
    }
  });

  if (!LEGACY_EVENTS_ENABLED) return;

  // ---------------------------------------------------------------------------
  // Legacy / debug events below: disabled by default (see LEGACY_EVENTS_ENABLED).
  // ---------------------------------------------------------------------------

  socket.on('testHandler', () => {
    socket.emit('testHandlerResponse', { received: true, timestamp: new Date().toISOString() });
  });

  socket.on('debugSocket', () => {
    socket.emit('debugSocketResponse', {
      socketId: socket.id,
      userId: socket.userId,
      rooms: Array.from(socket.rooms),
      timestamp: new Date().toISOString()
    });
  });

  socket.on('testMessage', async (data) => {
    try {
      const { conversationId, text } = data || {};
      if (!conversationId || !text) return;
      if (!(await isConversationMember(conversationId, socket.userId))) return;
      io.to(conversationId.toString()).emit('newMessage', {
        _id: 'test-' + Date.now(),
        conversationId: conversationId.toString(),
        senderId: socket.userId,
        text,
        createdAt: new Date().toISOString(),
        isDeleted: false
      });
    } catch (error) {
      console.error('Error handling test message:', error);
    }
  });

  socket.on('message:new', async (data) => {
    try {
      const { receiverId, message } = data || {};
      const senderId = socket.userId;
      if (!receiverId || !message) return;
      const receiverRoom = notificationService.getUserSocketId(receiverId);
      if (receiverRoom) {
        io.to(receiverRoom).emit('message:received', { senderId, message });
      }
      await notificationService.notify(receiverId, 'message', message, `/messages/${senderId}`, io, senderId);
    } catch (error) {
      console.error('Error in message:new:', error);
    }
  });

  socket.on('bid:new', async (data) => {
    try {
      const { jobId, clientId, bidAmount } = data || {};
      const freelancerId = socket.userId;
      if (!jobId || !clientId || !bidAmount) return;
      const clientRoom = notificationService.getUserSocketId(clientId);
      if (clientRoom) {
        io.to(clientRoom).emit('bid:received', { jobId, freelancerId, bidAmount });
      }
      await notificationService.notify(clientId, 'bid', `New bid of $${bidAmount} received for your job`, `/jobs/${jobId}`, io);
    } catch (error) {
      console.error('Error in bid:new:', error);
    }
  });

  socket.on('job:hired', async (data) => {
    try {
      const { jobId, freelancerId } = data || {};
      const clientId = socket.userId;
      if (!jobId || !freelancerId) return;
      const freelancerRoom = notificationService.getUserSocketId(freelancerId);
      if (freelancerRoom) {
        io.to(freelancerRoom).emit('job:hired:received', { jobId, clientId });
      }
      await notificationService.notify(freelancerId, 'job_hired', 'You have been hired for a job!', `/jobs/${jobId}`, io);
    } catch (error) {
      console.error('Error in job:hired:', error);
    }
  });

  socket.on('work:submitted', async (data) => {
    try {
      const { jobId, clientId } = data || {};
      const freelancerId = socket.userId;
      if (!jobId || !clientId) return;
      const clientRoom = notificationService.getUserSocketId(clientId);
      if (clientRoom) {
        io.to(clientRoom).emit('work:submitted:received', { jobId, freelancerId });
      }
      await notificationService.notify(clientId, 'work_submitted', 'Work has been submitted for your review', `/jobs/${jobId}`, io);
    } catch (error) {
      console.error('Error in work:submitted:', error);
    }
  });

  socket.on('work:approved', async (data) => {
    try {
      const { jobId, freelancerId } = data || {};
      const clientId = socket.userId;
      if (!jobId || !freelancerId) return;
      const freelancerRoom = notificationService.getUserSocketId(freelancerId);
      if (freelancerRoom) {
        io.to(freelancerRoom).emit('work:approved:received', { jobId, clientId });
      }
      await notificationService.notify(freelancerId, 'work_approved', 'Your work has been approved!', `/jobs/${jobId}`, io);
    } catch (error) {
      console.error('Error in work:approved:', error);
    }
  });
};

module.exports = { setupSocketHandlers };
