const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const NotificationService = require('./services/notificationService');

let io;
let notificationService;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'https://www.hopeforpaws.club',
        'https://hope-for-paws-official-backend.vercel.app',
        'http://localhost:5173'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  notificationService = new NotificationService(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.user.username})`);
    console.log(`🔗 Socket ID: ${socket.id}`);
    
    // Register user with notification service
    notificationService.registerUser(socket.userId, socket.id);
    console.log(`📝 User registered with notification service: ${socket.userId} -> ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    console.log(`🏠 User joined room: user_${socket.userId}`);

    // Handle notification read status
    socket.on('markNotificationRead', async (notificationId) => {
      try {
        await notificationService.markAsRead(notificationId, socket.userId);
        socket.emit('notificationUpdated', { notificationId, isRead: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Handle mark all notifications as read
    socket.on('markAllNotificationsRead', async () => {
      try {
        await notificationService.markAllAsRead(socket.userId);
        socket.emit('allNotificationsRead');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Handle delete notification
    socket.on('deleteNotification', async (notificationId) => {
      try {
        await notificationService.deleteNotification(notificationId, socket.userId);
        socket.emit('notificationDeleted', { notificationId });
      } catch (error) {
        console.error('Error deleting notification:', error);
        socket.emit('error', { message: 'Failed to delete notification' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      notificationService.removeUser(socket.userId);
    });
  });

  return { io, notificationService };
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const getNotificationService = () => {
  if (!notificationService) {
    throw new Error('Notification service not initialized');
  }
  return notificationService;
};

module.exports = {
  initializeSocket,
  getIO,
  getNotificationService
}; 