const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');

// 1. Create Product
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId).select('isSeller sellerStatus');

    if (!user || !user.isSeller) {
      return res.status(403).json({ message: 'Only sellers can create products' });
    }

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') return res.status(403).json({ message: 'Seller account is suspended' });

    const { 
      title, description, price, category, countInStock,
      brand, sku, discountPrice, additionalInfo
    } = req.body;

    if (!title || price === undefined || !category || !brand || !sku) {
      return res.status(400).json({ message: 'Title, brand, sku, price, and category are required' });
    }

    // Strict Validations
    if (Number(price) < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (Number(countInStock) < 0) return res.status(400).json({ message: 'Stock cannot be negative' });
    if (discountPrice && Number(discountPrice) >= Number(price)) {
      return res.status(400).json({ message: 'Discount price must be less than the regular price' });
    }

    let parsedAdditionalInfo = [];
    if (additionalInfo) {
      try {
        parsedAdditionalInfo = typeof additionalInfo === 'string' ? JSON.parse(additionalInfo) : additionalInfo;
      } catch (e) {
        console.error('Error parsing additionalInfo:', e);
      }
    }

    let images = req.body.images || [];
    if (typeof images === 'string') images = [images];
    
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => `/uploads/profile-images/${file.filename}`);
      images = [...images, ...uploadedImages];
    }

    const product = await Product.create({
      sellerId: seller._id,
      title,
      description,
      price: Number(price),
      category,
      countInStock: Number(countInStock),
      brand,
      sku,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      additionalInfo: parsedAdditionalInfo,
      images,
      status: 'active',
      isVisible: true
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A product with this SKU or Title already exists in your store.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Public List (Updated for Frontend Filtering & Verified Badge)
exports.listProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    // Strictly filter out hidden items (from automated moderation)
    let query = { isVisible: true, isHidden: { $ne: true } };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 }; // default to new
    if (sort === 'priceAsc') sortObj = { price: 1 };
    else if (sort === 'priceDesc') sortObj = { price: -1 };

    const products = await Product.find(query)
      .sort(sortObj)
      .populate('sellerId', 'userId name status isVerified storeName')
      .lean();

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
    const seller = await Seller.findOne({ userId }).select('_id').lean();
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const products = await Product.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean();
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
      .populate('sellerId', 'userId name status isVerified storeName'); 

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSellerProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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

    // BUG-002 FIX: Guard against missing seller profile before accessing _id
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const {
      title, description, price, category, countInStock,
      brand, sku, discountPrice, additionalInfo
    } = req.body;

    // Strict Validations
    if (price && Number(price) < 0) return res.status(400).json({ message: 'Price cannot be negative' });
    if (countInStock && Number(countInStock) < 0) return res.status(400).json({ message: 'Stock cannot be negative' });
    if (discountPrice && Number(discountPrice) >= Number(price || product.price)) {
      return res.status(400).json({ message: 'Discount price must be less than the regular price' });
    }

    let parsedAdditionalInfo;
    if (additionalInfo !== undefined) {
      if (typeof additionalInfo === 'string') {
        try {
          parsedAdditionalInfo = JSON.parse(additionalInfo);
        } catch (e) {
          console.error('Error parsing additionalInfo:', e);
          parsedAdditionalInfo = [];
        }
      } else {
        parsedAdditionalInfo = additionalInfo;
      }
    }

    // Validation & Index Safety: Prevent false-positive duplicate errors
    if (title || sku) {
      const existing = await Product.findOne({
        sellerId: seller._id,
        _id: { $ne: id },
        $or: [
          { title: title || product.title },
          { sku: sku || product.sku }
        ]
      });
      if (existing) {
        return res.status(400).json({ message: 'A product with this SKU or Title already exists in your store.' });
      }
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
    product.brand = brand || product.brand;
    product.sku = sku || product.sku;
    product.discountPrice = discountPrice ? Number(discountPrice) : product.discountPrice;
    if (parsedAdditionalInfo !== undefined) product.additionalInfo = parsedAdditionalInfo;

    // Media Sync Logic
    let imagesToDelete = [];
    if (req.body.imagesToDelete) {
      try {
        imagesToDelete = JSON.parse(req.body.imagesToDelete);
      } catch (e) {
        if (typeof req.body.imagesToDelete === 'string') {
          imagesToDelete = [req.body.imagesToDelete];
        } else {
          imagesToDelete = req.body.imagesToDelete;
        }
      }
    }

    if (imagesToDelete.length > 0) {
      product.images = product.images.filter(img => !imagesToDelete.includes(img));
    }

    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => `/uploads/profile-images/${file.filename}`);
      product.images = [...product.images, ...uploadedImages];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A product with this SKU or Title already exists in your store.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;

    // BUG-003 FIX: Guard against missing seller profile before accessing _id
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Toggle Visibility
exports.toggleProductVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId;

    // 1. Fast lean lookup just for the Seller ID
    const seller = await Seller.findOne({ userId }).select('_id').lean();
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    // 2. Fast lean lookup to get current status
    const currentProduct = await Product.findOne({ _id: id, sellerId: seller._id }).select('status').lean();
    if (!currentProduct) return res.status(404).json({ message: 'Product not found or not authorized' });

    const newStatus = currentProduct.status === 'hidden' ? 'active' : 'hidden';
    const newVisibility = newStatus === 'active';

    // 3. Atomic direct update - avoids loading huge objects, skips pre-save overhead, incredibly fast
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { status: newStatus, isVisible: newVisibility } },
      { new: true, runValidators: true }
    );

    res.json({ message: `Product is now ${newStatus}`, product: updatedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};