const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Authorization header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      console.error('No authorization header provided');
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.error('No token found in authorization header');
      return res.status(401).json({ message: "No token provided" });
    }

    console.log('Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // The token contains 'id' from signIn function
    const userId = decoded.id;
    
    if (!userId) {
      console.error('No user ID found in token payload');
      return res.status(401).json({ message: "Invalid token format" });
    }
    
    console.log('Looking for user with ID:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(401).json({ message: "User not found" });
    }

    console.log('User found, setting user in request');
    // Set both userId and id for consistency
    req.user = { 
      userId: user._id.toString(),
      id: user._id.toString()
    };
    console.log('req.user set:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error stack:', error.stack);
    res.status(401).json({ 
      message: "Invalid or expired token", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = auth;