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

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
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

// CORS configuration
const corsOptions = {
  origin: [
    'https://hope-for-paws-official.vercel.app',
    'http://localhost:3000',
    'https://hope-for-paws-official-backend.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://hope-for-paws-official.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

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

// Your routes here
app.get('/api', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      code: err.code,
      stack: err.stack
    } : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



