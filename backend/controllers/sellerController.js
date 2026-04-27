const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');

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

// Seller applies with details
exports.applyAsSeller = async (req, res) => {
  try {
    const { name, email, cnic, location } = req.body;
    if (!name || !email || !cnic || !location) {
      return res.status(400).json({ message: 'name, email, cnic, location are required' });
    }

    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingSeller = await Seller.findOne({ userId });
    if (existingSeller) {
      return res.status(400).json({ message: 'Seller profile already exists' });
    }

    const seller = await Seller.create({ userId, name, email, cnic, location, status: 'pending' });

    user.isSeller = true;
    user.sellerStatus = 'pending';
    user.canBuy = false;
    await user.save();

    return res.status(201).json({ message: 'Seller application submitted', seller });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Seller profile already exists' });
    }
    console.error('applyAsSeller error:', err.message);
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

// Admin updates seller status
exports.updateSellerStatus = async (req, res) => {
  try {
    const requesterId = req.user?.id || req.user?.userId;
    await ensureAdmin(requesterId);

    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'verified', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    seller.status = status;
    if (notes) seller.notes = notes;
    await seller.save();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isSeller = true; // remains seller
    user.sellerStatus = status;
    // BUG-005 FIX: canBuy is now driven by status — only verified sellers can purchase
    user.canBuy = status === 'verified';
    if (!user.sellerSince) user.sellerSince = new Date();
    await user.save();

    // Update products visibility based on status (hide if suspended)
    const visible = status !== 'suspended';
    await Product.updateMany(
      { sellerId: seller._id },
      { isVisible: visible, status: visible ? 'active' : 'hidden' }
    );

    return res.json({ message: 'Seller status updated', sellerStatus: status });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    console.error('updateSellerStatus error:', err.message);
    res.status(err.status || 500).json({ message: 'Server error' });
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
