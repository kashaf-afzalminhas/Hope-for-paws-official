const dns = require('dns');
// Custom DNS servers are opt-in (e.g. DNS_SERVERS=8.8.8.8,1.1.1.1 for local networks with broken DNS).
// On AWS and most hosts the server's own DNS must be used, so nothing is overridden by default.
if (process.env.DNS_SERVERS) {
  try {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  } catch (e) {
    console.warn('Failed to set DNS servers, falling back to OS defaults:', e.message);
  }
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
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reportRoutes = require('./routes/reportRoutes');
const promoRoutes = require('./routes/promoRoutes');

// Import notification service
const NotificationService = require('./services/notificationService');

dotenv.config();

// Fail fast on missing configuration instead of starting a half-working server
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' &&
    !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
  console.warn('WARNING: Cloudinary is not configured. Uploaded images will be saved on this server\'s disk and lost on redeploy.');
}

mongoose.connect(process.env.MONGO_URI, {
  tls: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(async () => {
    console.log('MongoDB connected successfully');
    // After a restart nobody is connected yet: clear "online" flags left over from before
    try {
      await mongoose.model('User').updateMany({ status: 'online' }, { $set: { status: 'offline' } });
    } catch (e) {
      console.warn('Could not reset online statuses:', e.message);
    }
  })
  .catch(err => {
    console.error('Failed to connect MongoDB:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });

const app = express();

// Behind a load balancer / nginx, use the real client IP (needed for rate limits).
// Set TRUST_PROXY=0 if the API is exposed directly to the internet without a proxy.
const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return process.env.NODE_ENV === 'production' ? 1 : false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return /^\d+$/.test(value) ? Number(value) : value; // number of hops, or e.g. "loopback"
};
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

// Allowed browser origins (extra ones can be added with CORS_ORIGINS="https://a.com,https://b.com")
const { ALLOWED_ORIGINS: BASE_ALLOWED_ORIGINS } = require('./config/allowedOrigins');
const ALLOWED_ORIGINS = [
  ...BASE_ALLOWED_ORIGINS,
  // Legacy domain kept until DNS/redirects fully cut over
  'https://www.hopeforpaws.club',
  'https://hopeforpaws.club',
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
];
// const server = http.createServer(app);

// Initialize Socket.IO
// const io = initSocket(server);
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
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

// Initialize notification service
const notificationService = new NotificationService(io);
notificationService.scheduleDailyDigestJob();

// Attach Socket.IO instance to Express app so it can be accessed in controllers
app.set("socketio", io);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
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
    // The account must still exist (e.g. not deleted by an admin)
    const exists = await mongoose.model('User').exists({ _id: userId });
    if (!exists) {
      return next(new Error('Authentication error: Account not found'));
    }
    socket.userId = String(userId);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication error: ' + error.message));
  }
});

// Socket.IO connection handling
initChatReminderWorker(notificationService);

io.on('connection', async (socket) => {
  // Every socket joins its user's personal room right away (used for messages and notifications)
  socket.join(socket.userId);

  // Register event handlers first, so events sent right after connecting (e.g. joinConversation) aren't lost
  const { setupSocketHandlers } = require('./services/socketHandler');
  setupSocketHandlers(io, socket, notificationService);

  socket.on('disconnect', async () => {
    await notificationService.removeUserSocket(socket.userId, socket.id);
  });

  // Add user to notification service (marks them online)
  try {
    await notificationService.addUserSocket(socket.userId, socket.id);
  } catch (error) {
    console.error('Failed to register user socket:', error);
  }

  socket.on('error', (error) => {
    console.error('Socket error for user:', socket.userId, error);
  });

});

// Make notification service available globally
global.notificationService = notificationService;
app.set('notificationService', notificationService);

// Add timeout middleware
app.use((req, res, next) => {
  // Set timeout to 30 seconds
  // Uploads (multipart) get longer, since several images may be sent on to Cloudinary
  const isUpload = (req.headers['content-type'] || '').startsWith('multipart/form-data');
  req.setTimeout(isUpload ? 120000 : 30000, () => {
    res.status(504).json({ message: 'Request timeout' });
  });
  next();
});

// Helmet: HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:", "http://localhost:3000"],
      connectSrc: [
        "'self'",
        "https://hopeforpawshub.co",
        "https://www.hopeforpawshub.co",
        "https://api.hopeforpawshub.co",
        "https://www.hopeforpaws.club",
        "https://hopeforpaws.club",
        "http://localhost:5173",
        "http://localhost:5174",
        "ws://localhost:5173",
        "ws://localhost:5174",
        "wss://api.hopeforpawshub.co",
      ],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin images from Cloudinary
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded by localhost:5173/5174
}));

// CORS configuration
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
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware (it also answers OPTIONS preflight requests)
app.use(cors(corsOptions));
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

// Login limiter: 20 failed attempts per 15 minutes per IP (successful logins don't count)
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(['/auth/signin', '/auth/login', '/auth/login-google', '/auth/complete-google-registration', '/auth/change-password'], authLoginLimiter);
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Block MongoDB operator injection: drop any request keys that start with "$" (e.g. {"code": {"$ne": null}})
const stripMongoOperators = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 10) return;
  for (const key of Object.keys(value)) {
    if (key.startsWith('$')) {
      delete value[key];
    } else {
      stripMongoOperators(value[key], depth + 1);
    }
  }
};
app.use((req, res, next) => {
  stripMongoOperators(req.body);
  stripMongoOperators(req.query);
  stripMongoOperators(req.params);
  next();
});

app.use(passport.initialize());

// Uploaded files: types that can run code in a browser are never served, and everything else
// is sent with a sandbox policy so it can't act as a web page or script
app.use('/uploads', (req, res, next) => {
  if (/\.(svg|svgz|html?|xhtml|xml|js|mjs|php|css)$/i.test(req.path)) {
    return res.status(404).end();
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; sandbox");
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Request logging (method and path only; set LOG_REQUESTS=false to turn it off)
if (process.env.LOG_REQUESTS !== 'false') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Test endpoint for notifications (no auth). It no longer echoes request headers (they contain login tokens).
app.get('/api/notifications/test', (req, res) => {
  res.json({
    message: 'Notification endpoint is accessible',
    timestamp: new Date().toISOString()
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
app.use('/api/promos', promoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reports', reportRoutes);

// Root route handler
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Hope For Paws Backend API!" });
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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

  // Upload errors (too big, wrong type) are the user's mistake, not a server error
  if (err && (err.name === 'MulterError' || /only image files/i.test(err.message || ''))) {
    const tooBig = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({ message: tooBig ? 'File too large' : (err.message || 'Image upload failed') });
  }

  // Handle other errors. Internal error details are never sent to users in production.
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';
  res.status(status).json({
    message: status < 500 ? (err.message || 'Bad request') : (isDev ? err.message : 'Something went wrong!'),
    ...(isDev ? { error: err } : {})
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

