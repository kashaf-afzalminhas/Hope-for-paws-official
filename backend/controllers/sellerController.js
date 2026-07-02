const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');

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
    const { fullName, storeName, email, phone, address, bankName, accountTitle, accountNumber } = req.body;
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
      paymentDetails: {
        bankName,
        accountTitle,
        accountNumber
      },
      profileImage,
      status: 'pending',
      isVerified: false
    });

    user.isSeller = true;
    user.sellerStatus = 'pending';
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
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: seller.email,
          subject: 'You are now a Verified Seller on Hope For Paws! \uD83D\uDC3E',
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e5e0d8;">
              <div style="background: linear-gradient(135deg, #6b493d, #a07855); color: white; padding: 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 26px;">Hope for Paws \uD83D\uDC3E</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Verified Seller Program</p>
              </div>
              <div style="padding: 28px; background-color: #fdfbf7;">
                <h2 style="color: #4a342e; margin-top: 0;">Congratulations, ${seller.storeName}! \uD83C\uDF89</h2>
                <p style="color: #5d4037; line-height: 1.7; font-size: 15px;">
                  We are thrilled to inform you that your seller application has been <strong>approved</strong>.
                  Your store is now part of our Verified Seller network!
                </p>
                <div style="margin: 24px 0; padding: 16px; background-color: #fff; border-left: 4px solid #4caf50; border-radius: 6px;">
                  <p style="margin: 0; color: #2e7d32; font-weight: bold;">What this means for you:</p>
                  <ul style="color: #5d4037; line-height: 1.8; padding-left: 20px; margin-bottom: 0;">
                    <li>A premium <strong>Verified Seller</strong> badge has been added to your storefront.</li>
                    <li>Your products will stand out with enhanced buyer trust.</li>
                    <li>You now have full access to all marketplace features.</li>
                  </ul>
                </div>
                <p style="color: #5d4037; line-height: 1.7; font-size: 15px;">
                  Thank you for being a trusted member of our community. We look forward to seeing your store grow!
                </p>
              </div>
              <div style="background-color: #f5f3ed; padding: 16px; text-align: center; color: #8d6e63; font-size: 12px;">
                <p style="margin: 0;">Hope for Paws. All rights reserved.</p>
              </div>
            </div>
          `
        });
      } else {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: seller.email,
          subject: 'Update regarding your Hope for Paws Seller Account',
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 1px solid #e5e0d8;">
              <div style="background: linear-gradient(135deg, #6b493d, #a07855); color: white; padding: 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 26px;">Hope for Paws \uD83D\uDC3E</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Seller Account Update</p>
              </div>
              <div style="padding: 28px; background-color: #fdfbf7;">
                <h2 style="color: #4a342e; margin-top: 0;">Hi ${seller.storeName},</h2>
                <p style="color: #5d4037; line-height: 1.7; font-size: 15px;">
                  Thank you for your interest in becoming a Verified Seller on Hope for Paws.
                  After careful review, we were unable to approve your verification at this time.
                </p>
                ${notes ? `
                <div style="margin: 24px 0; padding: 16px; background-color: #fff; border-left: 4px solid #e65100; border-radius: 6px;">
                  <p style="margin: 0 0 8px; color: #e65100; font-weight: bold;">Reason provided by the admin:</p>
                  <p style="margin: 0; color: #5d4037; line-height: 1.6; font-style: italic;">${notes}</p>
                </div>` : ''}
                <div style="margin: 24px 0; padding: 16px; background-color: #fff; border-left: 4px solid #1976d2; border-radius: 6px;">
                  <p style="margin: 0; color: #1565c0; font-weight: bold;">Important:</p>
                  <ul style="color: #5d4037; line-height: 1.8; padding-left: 20px; margin-bottom: 0;">
                    <li>You still have <strong>full access</strong> to your Seller Dashboard.</li>
                    <li>You can update your information and <strong>re-apply</strong> once the issue is resolved.</li>
                    <li>Your existing products and order history remain intact.</li>
                  </ul>
                </div>
                <p style="color: #5d4037; line-height: 1.7; font-size: 15px;">
                  If you have any questions, please don't hesitate to reach out to our support team.
                </p>
              </div>
              <div style="background-color: #f5f3ed; padding: 16px; text-align: center; color: #8d6e63; font-size: 12px;">
                <p style="margin: 0;">Hope for Paws. All rights reserved.</p>
              </div>
            </div>
          `
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
