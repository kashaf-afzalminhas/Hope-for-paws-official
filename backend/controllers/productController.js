const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');

// 1. Create Product
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId).select('isSeller sellerStatus');
    if (!user || !user.isSeller) return res.status(403).json({ message: 'Only sellers can create products' });

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') return res.status(403).json({ message: 'Seller is suspended' });

    const { title, description, price, category, countInStock, images = [] } = req.body;
    if (!title || price === undefined || !category) return res.status(400).json({ message: 'Title, price, and category are required' });

    const product = await Product.create({
      sellerId: seller._id,
      title,
      description,
      price,
      category,
      countInStock,
      images
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Public List (Updated for Frontend Filtering & Verified Badge)
exports.listProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isVisible: true })
      .sort({ createdAt: -1 })
      // ✅ CRITICAL UPDATE (Kept):
      // 1. 'userId' -> Helps frontend hide your own products
      // 2. 'status' -> Helps frontend show the "Verified" badge
      .populate('sellerId', 'userId name status'); 

    return res.json(products);
  } catch (err) {
    console.error('listProducts Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Seller List (My Products)
exports.listMyProducts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const products = await Product.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get Single Product (Updated to prevent Detail Page Crash)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      // ✅ FIX ADDED: Populates seller details so the Detail Page can read name & status
      .populate('sellerId', 'userId name status'); 

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    product.title = req.body.title || product.title;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.category = req.body.category || product.category;
    product.countInStock = req.body.countInStock || product.countInStock;
    product.images = req.body.images || product.images;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};