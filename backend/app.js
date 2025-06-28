const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
//const animalRoutes = require('./routes/animalRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const faqRoutes = require('./routes/faqRoutes');
const contactusRoutes = require('./routes/contactRoutes'); // Ensure this is correctly imported
const rateLimit = require('express-rate-limit');

dotenv.config();

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://www.hopeforpaws.club',
      'https://hope-for-paws-official-backend.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add headers middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS requests for debugging
  console.log('Request origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
    return res.status(204).send();
  }
  
  // For non-preflight requests
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
  
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
//app.use('/animal', animalRoutes);
//app.use('/adoptions', adoptionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/faqRoutes', faqRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api', contactusRoutes); // Ensure this is correctly used

// Root route handler
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Hope For Paws Backend API!" });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



