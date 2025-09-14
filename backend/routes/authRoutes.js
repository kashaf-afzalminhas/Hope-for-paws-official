const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust the path according to your project structure
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/multer_middleware');
const { 
  signUp, 
  signIn, 
  forgotPassword, 
  verifyCode, 
  updateProfile, 
  signOut, 
  changePassword, 
  verifyRegistrationOTP, 
  resendOTP,
  getUserById, 
  getAllUsers, 
  searchUsers,
  uploadProfileImage: uploadProfileImageController,
  getUserPublicProfile,
  getUserProfile,
  removeProfileImage,
  validateToken,
  googleLogins,
  completeGoogleRegistration,
  validateUser,
  verifyResetCode,
  resetPassword,
  resendResetCode,
  addPhoneNumber
} = require('../controllers/userController');
// const { signUp, signIn} = require('./auth')
router.post('/register', signUp);
router.post('/verify-registration', verifyRegistrationOTP);
router.post('/resend-otp', resendOTP);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/update-profile', updateProfile);
router.post('/signout', signOut); 
router.post('/changePassword',changePassword);
// User management routes
router.post('/getUserById', getUserById);
router.post('/getAllUsers', getAllUsers);
router.post('/searchUsers', searchUsers);

// Token validation route
router.get('/user/validate', auth, validateToken);

// Debug route to check token (remove this in production)
router.get('/debug-token', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('Debug - Authorization header:', authHeader);
  res.json({ 
    hasAuthHeader: !!authHeader,
    authHeader: authHeader,
    message: 'Debug endpoint - check server logs'
  });
});

// Profile management routes
router.post('/upload-profile-image', auth, uploadProfileImage.single('image'), uploadProfileImageController);
router.get('/profile', auth, getUserProfile);
router.get('/profile/:id', getUserPublicProfile);
router.delete('/remove-profile-image', auth, removeProfileImage);

// Google Auth Routes
router.post("/login-google", googleLogins);
router.post("/complete-google-registration", completeGoogleRegistration);

// Validation and reset password routes
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/resend-reset-code', resendResetCode);

// Phone verification routes
router.post('/add-phone-number', auth, addPhoneNumber);

module.exports = router;


