const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');

// Sellers create products; visible unless seller suspended
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId).select('isSeller sellerStatus');
    if (!user || !user.isSeller) {
      return res.status(403).json({ message: 'Only sellers can create products' });
    }

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') {
      return res.status(403).json({ message: 'Seller is suspended; cannot add products' });
    }

    const { title, description, price, images = [] } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ message: 'title and price are required' });
    }

    const product = await Product.create({
      sellerId: seller._id,
      title,
      description,
      price,
      images
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error('createProduct error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Public list: only visible products
exports.listProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isVisible: true }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Seller's own products (all, even hidden)
exports.listMyProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const products = await Product.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    console.error('listMyProducts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
