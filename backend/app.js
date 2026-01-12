const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
// const http = require('http');
// const initSocket = require('./config/socket');
const authRoutes = require('./routes/authRoutes');
//const animalRoutes = require('./routes/animalRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const faqRoutes = require('./routes/faqRoutes');
const contactusRoutes = require('./routes/contactRoutes'); // Ensure this is correctly imported
const notificationRoutes = require('./routes/notifications');
const notificationStatsRoutes = require('./routes/notificationStats');
const { initChatReminderWorker } = require('./queues/chatEmailQueue');
const rateLimit = require('express-rate-limit');
const messageRoutes = require('./routes/message');
const conversationRoutes = require('./routes/conversation');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/adminRoutes');

// Import notification service
const NotificationService = require('./services/notificationService');

dotenv.config();
console.log('MONGO_URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });

const app = express();
// const server = http.createServer(app);

// Initialize Socket.IO
// const io = initSocket(server);
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'https://www.hopeforpaws.club',
      'http://localhost:5173'
     
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Initialize notification service
const notificationService = new NotificationService(io);

// Attach Socket.IO instance to Express app so it can be accessed in controllers
app.set("socketio", io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket.IO token received:', token); // Debug log
    if (!token) {
      console.log('Socket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id; // Accept either field
    if (!userId) {
      console.log('Socket connection attempt with invalid token');
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.userId = userId;
    console.log('Socket authentication successful for user:', socket.userId);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication error: ' + error.message));
  }
});

// Socket.IO connection handling
initChatReminderWorker(notificationService);

io.on('connection', async (socket) => {
  console.log('User connected via Socket.IO:', socket.userId);
  
  // Add user to notification service
  await notificationService.addUserSocket(socket.userId, socket.id);

  socket.on('disconnect', async (reason) => {
    console.log('User disconnected via Socket.IO:', socket.userId, 'Reason:', reason);
    await notificationService.removeUserSocket(socket.userId);
  });

  socket.on('error', (error) => {
    console.error('Socket error for user:', socket.userId, error);
  });

  // Setup socket handlers for chat functionality
  const { setupSocketHandlers } = require('./services/socketHandler');
  setupSocketHandlers(io, socket, notificationService);
});

// Make notification service available globally
global.notificationService = notificationService;
app.set('notificationService', notificationService);

// Add timeout middleware
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  req.setTimeout(30000, () => {
    res.status(504).json({ message: 'Request timeout' });
  });
  next();
});

// CORS configuration
const corsOptions = {
  origin: [
    'https://www.hopeforpaws.club',

    'http://localhost:5173',

  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'cache-control',
    'Cache-Control',
    'If-None-Match',
    'ETag'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'ETag'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add headers middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
  res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased from 1000 to 5000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and test endpoints
    return req.path === '/health' || 
           req.path === '/socket-health' || 
           req.path === '/api/notifications/test' ||
           req.path === '/api/test' ||
           req.path === '/test';
  }
});

app.use(limiter);
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add route logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add a test endpoint for notifications (without auth)
app.get('/api/notifications/test', (req, res) => {
  res.json({ 
    message: 'Notification endpoint is accessible',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
//app.use('/animal', animalRoutes);
//app.use('/adoptions', adoptionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/faqRoutes', faqRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-stats', notificationStatsRoutes);
app.use('/api', contactusRoutes); // Ensure this is correctly used
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/chats', chatRoutes);

// Root route handler
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Hope For Paws Backend API!" });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: req.app.get('socketio') ? req.app.get('socketio').engine.clientsCount : 0
  });
});

// Socket.IO health check
app.get('/socket-health', (req, res) => {
  res.json({ 
    socketConnections: io.engine.clientsCount,
    notificationServiceActive: !!notificationService
  });
});

// Your routes here
app.get('/api', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Add error handling middleware at the end
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle timeout errors
  if (err.name === 'TimeoutError') {
    return res.status(504).json({ 
      message: 'Request timeout',
      error: 'The request took too long to process'
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


