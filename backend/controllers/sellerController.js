const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

// Email Transporter Setup (matches codebase pattern in userController/contactController)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Ensure the requesting user is an admin
 * @param {string} userId - The user ID to check
 * @throws {Error} If user is not admin
 */
const ensureAdmin = async (userId) => {
  const user = await User.findById(userId).select('isAdmin');
  if (!user || !user.isAdmin) {
    const err = new Error('Admin access required');
    err.status = 403;
    throw err;
  }
  return user;
};

// Seller onboarding (post-registration)
exports.onboardSeller = async (req, res) => {
  try {
    const { fullName, storeName, email, phone, address } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if seller profile already exists for this user
    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
      return res.status(400).json({ message: 'Seller profile already exists' });
    }

    // Check if storeName is already taken
    const existingStore = await Seller.findOne({ storeName: { $regex: new RegExp(`^${storeName}$`, 'i') } });
    if (existingStore) {
      return res.status(409).json({ message: 'This store name is already taken. Please choose another one.' });
    }

    let profileImage = '';
    if (req.file) {
      profileImage = `/uploads/profile-images/${req.file.filename}`;
    }

    const seller = await Seller.create({
      userId,
      fullName,
      storeName,
      email,
      phone,
      address,
      profileImage,
      status: 'pending',
      isVerified: false
    });

    user.isSeller = true;
    user.sellerStatus = 'pending';
    user.phone = phone;
    user.phoneVerified = true;
    // user.canBuy is left true per new rules
    await user.save();

    return res.status(201).json({ message: 'Seller onboarded successfully', seller });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Seller profile already exists' });
    }
    console.error('onboardSeller error:', err.message);
    res.status(err.status || 500).json({ message: 'Server error' });
  }
};

// Seller fetches own profile
exports.getMySellerProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    const user = await User.findById(userId).select('sellerStatus isSeller canBuy');
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    return res.json({ seller, sellerStatus: user?.sellerStatus, isSeller: user?.isSeller, canBuy: user?.canBuy });
  } catch (err) {
    console.error('getMySellerProfile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin updates seller verification status
exports.updateSellerStatus = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.user?.userId;
    await ensureAdmin(requesterId);

    const { userId } = req.params;
    const { isVerified, notes } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ message: 'isVerified must be a boolean' });
    }

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    // --- Status Update (BUG FIX: rejection now sets 'suspended', not 'pending') ---
    seller.isVerified = isVerified;
    seller.status = isVerified ? 'verified' : 'suspended';
    if (notes) seller.notes = notes;
    await seller.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSeller = true; // remains seller regardless of verification outcome
    user.sellerStatus = seller.status;
    if (isVerified && !user.sellerSince) user.sellerSince = new Date();
    await user.save();

    // --- Email Notification (isolated: DB update succeeds even if email fails) ---
    let emailWarning = null;
    try {
      if (isVerified) {
        const { subject, html } = emailTemplates.buildSellerApprovedEmail({ storeName: seller.storeName });
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: seller.email,
          subject,
          html,
        });
      } else {
        const { subject, html } = emailTemplates.buildSellerRejectedEmail({ storeName: seller.storeName, notes });
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: seller.email,
          subject,
          html,
        });
      }
      console.log(`Verification email sent to ${seller.email} (status: ${seller.status})`);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
      emailWarning = 'Seller status updated successfully, but the notification email failed to send.';
    }

    return res.json({
      message: emailWarning || 'Seller verification status updated',
      isVerified: seller.isVerified,
      ...(emailWarning && { warning: emailWarning })
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    console.error('updateSellerStatus error:', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

// Admin gets all seller applications
exports.getAllSellerApplications = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.user?.userId;
    await ensureAdmin(requesterId);

    const sellers = await Seller.find({})
      .populate('userId', 'username email phone isSeller sellerStatus createdAt')
      .sort({ createdAt: -1 });

    return res.json({ sellers });
  } catch (err) {
    console.error('getAllSellerApplications error:', err.message);
    res.status(err.status || 500).json({ message: 'Server error' });
  }
};

// Admin gets seller application by seller profile id
exports.getSellerApplicationById = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.user?.userId;
    await ensureAdmin(requesterId);

    const seller = await Seller.findById(req.params.sellerId).populate(
      'userId',
      'username email phone isSeller sellerStatus createdAt'
    );
    if (!seller) return res.status(404).json({ message: 'Seller application not found' });

    return res.json({ seller });
  } catch (err) {
    console.error('getSellerApplicationById error:', err.message);
    res.status(err.status || 500).json({ message: 'Server error' });
  }
};
