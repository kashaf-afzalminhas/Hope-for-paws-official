const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');
const { toLocationSnapshot } = require('../utils/pakistanLocations');
const { saveImage, deleteImage } = require('../services/imageStorage');

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
    const { address } = req.body;
    const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : '';
    if (!storeName) return res.status(400).json({ message: 'Store name is required' });
    let location;
    try {
      location = toLocationSnapshot(typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location);
    } catch (parseError) {
      location = null;
    }
    if (!location) return res.status(400).json({ message: 'Select a valid country, province, and city.' });
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if seller profile already exists for this user
    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
      return res.status(400).json({ message: 'Seller profile already exists' });
    }

    // Check if storeName is already taken (case-insensitive, special characters escaped)
    const escapedStoreName = storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingStore = await Seller.findOne({ storeName: { $regex: new RegExp(`^${escapedStoreName}$`, 'i') } });
    if (existingStore) {
      return res.status(409).json({ message: 'This store name is already taken. Please choose another one.' });
    }

    // Name, email and phone come from the user's account (they were set at sign-up and are shown read-only).
    // Only if the account has no phone yet (e.g. Google sign-up) do we accept one here.
    const fullName = (user.username || '').trim() || storeName;
    const email = user.email;
    let phone = user.phone ? String(user.phone).trim() : '';
    let newPhone = null;
    if (!phone) {
      const submittedPhone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
      if (!/^\+?[0-9]{7,15}$/.test(submittedPhone)) {
        return res.status(400).json({ message: 'Please enter a valid phone number.' });
      }
      const phoneTaken = await User.exists({ phone: submittedPhone, _id: { $ne: user._id } });
      if (phoneTaken) {
        return res.status(409).json({ message: 'This phone number is already used by another account.' });
      }
      phone = submittedPhone;
      newPhone = submittedPhone;
    }

    // Store the image only after every check has passed
    let profileImage = '';
    if (req.file) {
      profileImage = await saveImage(req.file, 'profile-images');
    }

    let seller;
    try {
      seller = await Seller.create({
        userId,
        fullName,
        storeName,
        email,
        phone,
        address,
        location,
        profileImage,
        status: 'pending',
        isVerified: false
      });
    } catch (createErr) {
      if (profileImage) await deleteImage(profileImage).catch(() => {});
      throw createErr;
    }

    try {
      user.isSeller = true;
      user.sellerStatus = 'pending';
      if (newPhone) {
        // Saved but not marked verified: the user can verify it from their profile
        user.phone = newPhone;
        user.phoneVerified = false;
      }
      await user.save();
    } catch (userErr) {
      // Undo the seller profile so the user isn't left stuck and can try again
      await Seller.deleteOne({ _id: seller._id }).catch(() => {});
      if (profileImage) await deleteImage(profileImage).catch(() => {});
      if (userErr.code === 11000) {
        return res.status(409).json({ message: 'This phone number is already used by another account.' });
      }
      throw userErr;
    }

    return res.status(201).json({ message: 'Seller onboarded successfully', seller });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      if (field === 'storeName') {
        return res.status(409).json({ message: 'This store name is already taken. Please choose another one.' });
      }
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
    if (typeof notes === 'string' && notes.trim()) seller.notes = notes.trim().slice(0, 1000);
    await seller.save();

    // A suspended/rejected seller's products are taken off the marketplace straight away.
    // On re-approval, only the products that were hidden by the suspension come back
    // (products the seller had hidden themselves stay hidden).
    if (!isVerified) {
      await Product.updateMany(
        { sellerId: seller._id, status: { $ne: 'hidden' } },
        { $set: { isVisible: false, status: 'hidden', hiddenBySuspension: true } }
      );
    } else {
      await Product.updateMany(
        { sellerId: seller._id, hiddenBySuspension: true },
        { $set: { isVisible: true, status: 'active', hiddenBySuspension: false } }
      );
    }

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
