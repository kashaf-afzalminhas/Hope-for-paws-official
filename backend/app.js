const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Failed to set global DNS servers, falling back to OS defaults:', e.message);
}
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { ALLOWED_ORIGINS } = require('./config/allowedOrigins');
const authRoutes = require('./routes/authRoutes');
//const animalRoutes = require('./routes/animalRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const faqRoutes = require('./routes/faqRoutes');
const contactusRoutes = require('./routes/contactRoutes'); // Ensure this is correctly imported
const notificationRoutes = require('./routes/notifications');
const notificationStatsRoutes = require('./routes/notificationStats');
const rateLimit = require('express-rate-limit');
const messageRoutes = require('./routes/message');
const conversationRoutes = require('./routes/conversation');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');

// Import notification service
const NotificationService = require('./services/notificationService');

dotenv.config();

const IS_LAMBDA =
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.RUNTIME === 'lambda';

console.log('MONGO_URI:', process.env.MONGO_URI ? '[configured]' : '[missing]');

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    serverSelectionTimeoutMS: 30000,
  })
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch(err => {
      console.error('Failed to connect MongoDB:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
      });
    });
} else {
  console.warn('MONGO_URI not set yet — connection will be established by the Lambda handler');
}

const app = express();

// Required behind API Gateway / CloudFront so rate-limit & IPs work
app.set('trust proxy', true);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

let server = null;
let io = null;

// Socket.IO only for local / traditional Node hosting — not available on Lambda
if (!IS_LAMBDA) {
  const { createServer } = require('http');
  const { Server } = require('socket.io');

  server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
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
}

// Initialize notification service (works with or without Socket.IO)
const notificationService = new NotificationService(io);
notificationService.scheduleDailyDigestJob();

if (io) {
  app.set('socketio', io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('Socket.IO token received:', token ? '[present]' : '[missing]');
      if (!token) {
        console.log('Socket connection attempt without token');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
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

  const { initChatReminderWorker } = require('./queues/chatEmailQueue');
  initChatReminderWorker(notificationService);

  io.on('connection', async (socket) => {
    console.log('User connected via Socket.IO:', socket.userId);

    await notificationService.addUserSocket(socket.userId, socket.id);

    socket.on('disconnect', async (reason) => {
      console.log('User disconnected via Socket.IO:', socket.userId, 'Reason:', reason);
      await notificationService.removeUserSocket(socket.userId);
    });

    socket.on('error', (error) => {
      console.error('Socket error for user:', socket.userId, error);
    });

    const { setupSocketHandlers } = require('./services/socketHandler');
    setupSocketHandlers(io, socket, notificationService);
  });
} else {
  console.log('[Lambda] Socket.IO disabled — clients should use REST polling for notifications');
}

// Make notification service available globally
global.notificationService = notificationService;
app.set('notificationService', notificationService);

// CORS must run before other middleware so preflight and errors still get headers
const corsOptions = {
  origin: ALLOWED_ORIGINS,
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
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Node HTTP request timeouts are not available in Lambda/serverless-http
if (!IS_LAMBDA) {
  app.use((req, res, next) => {
    if (typeof req.setTimeout === 'function') {
      req.setTimeout(30000, () => {
        if (!res.headersSent) {
          res.status(504).json({ message: 'Request timeout' });
        }
      });
    }
    next();
  });
}

// Helmet: HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // API does not serve HTML; CSP breaks nothing useful and can confuse gateways
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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
    // Skip rate limiting for health checks, preflight, and test endpoints
    return req.method === 'OPTIONS' ||
           req.path === '/health' || 
           req.path === '/socket-health' || 
           req.path === '/api/notifications/test' ||
           req.path === '/api/test' ||
           req.path === '/test';
  }
});

app.use(limiter);

// Strict rate limiter for social actions (likes/comments) — 60 req/min per IP
const socialLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many social actions. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/posts/:id/like', socialLimiter);
app.use('/api/comments', socialLimiter);

// Strict rate limiter for write-heavy adoption actions (creation and requests) — 10 requests per 15 minutes per IP (Bug 20)
const adoptionWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    error: 'Too many adoption creation or request actions. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/adoptions', (req, res, next) => {
  if (req.method === 'POST') {
    return adoptionWriteLimiter(req, res, next);
  }
  next();
});

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
const uploadsStaticRoot = IS_LAMBDA
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsStaticRoot));

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
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiAssistantRoutes);

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
    runtime: IS_LAMBDA ? 'lambda' : 'node',
    socketEnabled: !!io,
    connections: io ? io.engine.clientsCount : 0
  });
});

// Socket.IO health check
app.get('/socket-health', (req, res) => {
  res.json({ 
    socketEnabled: !!io,
    socketConnections: io ? io.engine.clientsCount : 0,
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

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }

  if (err.name === 'TimeoutError') {
    return res.status(504).json({
      message: 'Request timeout',
      error: 'The request took too long to process'
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

if (!IS_LAMBDA) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;