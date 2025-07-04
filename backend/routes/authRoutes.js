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
  validateToken
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

// New profile management routes (protected with authentication)
router.post('/upload-profile-image', auth, uploadProfileImage.single('image'), uploadProfileImageController);
router.get('/profile', auth, getUserProfile);
router.get('/profile/:id', getUserPublicProfile);
router.delete('/remove-profile-image', auth, removeProfileImage);

// router.post('/google', googleSignIn);
// router.post('/validateEmail', validateEmail);
// Endpoint to change the password
router.post('/change-password', async (req, res) => {
  const { id, currentPassword, newPassword } = req.body;

  try {
    // Fetch the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


