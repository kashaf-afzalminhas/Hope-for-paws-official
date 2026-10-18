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
  addPhoneNumber,
  setPassword,
  sendEmailChangeOTP,
  verifyEmailChange
} = require('../controllers/userController');
// const { signUp, signIn} = require('./auth')
router.post('/register', signUp);
router.post('/verify-registration', verifyRegistrationOTP);
router.post('/resend-otp', resendOTP);
router.post('/signin', signIn);
// Alias for clarity: allow POST /auth/login in addition to /auth/signin
router.post('/login', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/update-profile', auth, updateProfile);
router.post('/signout', signOut); 
router.post('/change-password', auth, changePassword);
router.post('/set-password', auth, setPassword);
// User management routes
router.post('/getUserById', auth, getUserById);
router.post('/getAllUsers', auth, getAllUsers);
router.post('/searchUsers', auth, searchUsers);

// Token validation route
router.get('/user/validate', auth, validateToken);

// Debug route to check token: login required, and the token itself is never logged or echoed back
router.get('/debug-token', auth, (req, res) => {
  res.json({
    hasAuthHeader: true,
    userId: req.user.id,
    message: 'Token is valid'
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

// Email change verification routes
router.post('/send-email-change-otp', auth, sendEmailChangeOTP);
router.post('/verify-email-change', auth, verifyEmailChange);

module.exports = router;


