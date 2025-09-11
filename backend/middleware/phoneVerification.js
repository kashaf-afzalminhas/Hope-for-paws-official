const User = require('../models/User');

const checkPhoneVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a phone number and if it's verified
    if (!user.phone || !user.phoneVerified) {
      return res.status(403).json({ 
        message: 'Phone number verification required',
        requiresPhoneVerification: true,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          isVeterinarian: user.isVeterinarian,
          isAdmin: user.isAdmin,
        }
      });
    }

    // If phone is verified, continue to the next middleware/route
    next();
  } catch (error) {
    console.error('Phone verification middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkPhoneVerification };

