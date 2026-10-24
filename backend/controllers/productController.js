const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ShippingPolicy = require('../models/ShippingPolicy');
const GuaranteePolicy = require('../models/GuaranteePolicy');
const {
  resolveEffectiveShippingPolicy,
  resolveEffectiveGuaranteePolicy
} = require('../services/policyService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { saveImages, deleteImage } = require('../services/imageStorage');

const MAX_PRODUCT_IMAGES = 5;

// Public routes: reads the logged-in user's id from the token if one was sent (otherwise null)
const getOptionalUserId = (req) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.userId || decoded.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
};

// Deletes product images from storage, except ones still shown in existing orders (order history keeps them)
const deleteUnusedProductImages = async (urls) => {
  for (const url of urls || []) {
    try {
      const usedInOrder = await Order.exists({ 'items.image': url });
      if (!usedInOrder) await deleteImage(url);
    } catch (err) {
      console.error('Failed to delete product image', url, err.message);
    }
  }
};

// Escapes user text before using it inside a regular expression
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Route middleware: the caller must have a seller profile that isn't suspended.
 * Runs BEFORE image upload, so non-sellers can't upload files at all.
 */
exports.requireActiveSeller = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(403).json({ message: 'Only sellers can manage products' });
    if (seller.status === 'suspended') {
      return res.status(403).json({ message: 'Your seller account is suspended. Please contact Hope for Paws support.' });
    }
    req.seller = seller;
    next();
  } catch (err) {
    console.error('requireActiveSeller error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const validatePolicyReferences = async (sellerId, shippingPolicyId, guaranteePolicyId) => {
  const references = {};

  if (shippingPolicyId) {
    const policy = await ShippingPolicy.findOne({
      _id: shippingPolicyId,
      sellerId
    }).select('_id').lean();

    if (!policy) {
      throw new Error('Shipping policy was not found for this seller.');
    }

    references.shippingPolicyId = policy._id;
  } else if (shippingPolicyId === '') {
    references.shippingPolicyId = null;
  }

  if (guaranteePolicyId) {
    const policy = await GuaranteePolicy.findOne({
      _id: guaranteePolicyId,
      sellerId
    }).select('_id').lean();

    if (!policy) {
      throw new Error('Guarantee policy was not found for this seller.');
    }

    references.guaranteePolicyId = policy._id;
  } else if (guaranteePolicyId === '') {
    references.guaranteePolicyId = null;
  }

  return references;
};

// 1. Create Product
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await User.findById(userId).select('isSeller sellerStatus');

    if (!user || !user.isSeller) {
      return res.status(403).json({ message: 'Only sellers can create products' });
    }

    const seller = req.seller || await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') return res.status(403).json({ message: 'Seller account is suspended' });

    const {
      title, description, price, category, countInStock,
      brand, sku, discountPercentage, additionalInfo,
      lowStockThreshold, shippingPolicyId, guaranteePolicyId
    } = req.body;

    if (!title || price === undefined || !category || !brand || !sku) {
      return res.status(400).json({ message: 'Title, brand, sku, price, and category are required' });
    }

    let policyReferences;
    try {
      policyReferences = await validatePolicyReferences(
        seller._id,
        shippingPolicyId,
        guaranteePolicyId
      );
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Strict Validations
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: 'Price must be a valid number of 0 or more' });
    if (countInStock === undefined || countInStock === '' || !Number.isInteger(Number(countInStock)) || Number(countInStock) < 0) {
      return res.status(400).json({ message: 'Stock must be a whole number of 0 or more' });
    }
    if (lowStockThreshold !== undefined && Number(lowStockThreshold) < 0) {
      return res.status(400).json({ message: 'Low stock threshold cannot be negative' });
    }
    if (
      discountPercentage !== undefined &&
      (Number(discountPercentage) < 0 ||
        Number(discountPercentage) > 100)
    ) {
      return res.status(400).json({
        message: 'Discount percentage must be between 0 and 100.'
      });
    }

    let parsedAdditionalInfo = [];
    if (additionalInfo) {
      try {
        const rawInfo = typeof additionalInfo === 'string' ? JSON.parse(additionalInfo) : additionalInfo;
        if (Array.isArray(rawInfo)) {
          parsedAdditionalInfo = rawInfo
            .map(item => ({
              heading: (item.heading || '').trim(),
              details: (item.details || item.description || '').trim()
            }))
            .filter(item => item.heading !== '' || item.details !== '');
        }
      } catch (e) {
        console.error('Error parsing additionalInfo:', e);
      }
    }

    // Images only come from uploaded files (image links sent in the request body are ignored)
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length > MAX_PRODUCT_IMAGES) {
      return res.status(400).json({ message: `A product can have at most ${MAX_PRODUCT_IMAGES} images.` });
    }
    const images = await saveImages(files, 'products');

    const product = await Product.create({
      sellerId: seller._id,
      title,
      description,
      price: Number(price),
      category,
      countInStock: Number(countInStock),
      lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== '' ? Number(lowStockThreshold) : 5,
      brand,
      sku,
      discountPercentage:
        discountPercentage !== undefined ? Number(discountPercentage) : 0,
      additionalInfo: parsedAdditionalInfo,
      ...policyReferences,
      images,
      status: 'active',
      isVisible: true
    }).catch(async (createErr) => {
      await deleteUnusedProductImages(images);
      throw createErr;
    });

    return res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error(err);
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A product with this SKU or Title already exists in your store.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Public List (Updated for Frontend Filtering & Verified Badge)
exports.listProducts = async (req, res) => {
  try {
    const str = (v) => (typeof v === 'string' ? v : undefined);
    const category = str(req.query.category);
    const search = str(req.query.search);
    const sort = str(req.query.sort);
    const sellerId = str(req.query.sellerId);
    // Strictly filter out hidden items (from automated moderation)
    let query = { isVisible: true, isHidden: { $ne: true } };

    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) return res.json([]);
      query.sellerId = sellerId;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const safe = escapeRegex(search.trim().slice(0, 100));
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { brand: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } }
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


// 4. Get Single Product (Updated with dynamic sales and seller rating)
exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'userId name status isVerified storeName');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Hidden products (by the seller, by moderation, or because the seller is suspended)
    // are only visible to their own seller
    if (!product.isVisible || product.isHidden || product.status !== 'active') {
      const viewerId = getOptionalUserId(req);
      const isOwner = viewerId && product.sellerId?.userId && product.sellerId.userId.toString() === viewerId;
      if (!isOwner) return res.status(404).json({ message: 'Product not found' });
    }

    // Sales are counted only after successful delivery.
    const productSalesAgg = await Order.aggregate([
      {
        $match: {
          status: 'Delivered',
          'items.productId': product._id
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.productId': product._id
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$items.quantity' }
        }
      }
    ]);

    const productTotalSales = productSalesAgg[0]?.totalSales || 0;

    let sellerTotalSales = 0;
    let sellerRating = 0;
    let sellerReviewCount = 0;

    if (product.sellerId) {
      const sellerObjId = product.sellerId._id;

      // Count only delivered quantities across the seller's products.
      const sellerSalesAgg = await Order.aggregate([
        {
          $match: {
            sellerId: sellerObjId,
            status: 'Delivered'
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$items.quantity' }
          }
        }
      ]);

      sellerTotalSales = sellerSalesAgg[0]?.totalSales || 0;

      // Calculate the seller/store rating from reviews on all of the
      // seller's products.
      const sellerProducts = await Product.find({ sellerId: sellerObjId })
        .select('_id')
        .lean();

      const sellerProductIds = sellerProducts.map(({ _id }) => _id);

      if (sellerProductIds.length > 0) {
        const reviewStats = await Review.aggregate([
          {
            $match: {
              product: { $in: sellerProductIds },
              rating: { $gte: 1, $lte: 5 }
            }
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 }
            }
          }
        ]);

        const sellerReviewStats = reviewStats[0];

        if (sellerReviewStats) {
          sellerRating =
            Math.round(sellerReviewStats.averageRating * 10) / 10;
          sellerReviewCount = sellerReviewStats.reviewCount || 0;
        }
      }
    }

    const productObj = product.toObject();

    const [effectiveShipping, effectiveGuarantee] = await Promise.all([
      resolveEffectiveShippingPolicy(productObj),
      resolveEffectiveGuaranteePolicy(productObj)
    ]);

    productObj.shippingPolicy = effectiveShipping.policy;
    productObj.guaranteePolicy = effectiveGuarantee.policy;
    // Product-level sales.
    productObj.totalSales = productTotalSales;
    productObj.productTotalSales = productTotalSales;

    // Seller/store-level statistics.
    productObj.sellerTotalSales = sellerTotalSales;
    productObj.sellerRating = sellerRating;
    productObj.sellerReviewCount = sellerReviewCount;

    // Preserve the response shape used by the sahab branch.
    if (productObj.sellerId && typeof productObj.sellerId === 'object') {
      productObj.sellerId.totalSales = sellerTotalSales;
      productObj.sellerId.rating = sellerRating;
    }

    res.json(productObj);
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
    const seller = req.seller || await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') {
      return res.status(403).json({ message: 'Your seller account is suspended. Please contact Hope for Paws support.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: 'Product not found' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const {
      title, description, price, category, countInStock,
      brand, sku, discountPercentage, additionalInfo,
      lowStockThreshold, shippingPolicyId, guaranteePolicyId
    } = req.body;

    let updatePolicyReferences;
    try {
      updatePolicyReferences = await validatePolicyReferences(
        seller._id,
        shippingPolicyId,
        guaranteePolicyId
      );
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Strict Validations
    if (price !== undefined && price !== '' && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ message: 'Price must be a valid number of 0 or more' });
    }
    if (countInStock !== undefined && countInStock !== '' && (!Number.isInteger(Number(countInStock)) || Number(countInStock) < 0)) {
      return res.status(400).json({ message: 'Stock must be a whole number of 0 or more' });
    }
    if (lowStockThreshold !== undefined && Number(lowStockThreshold) < 0) {
      return res.status(400).json({ message: 'Low stock threshold cannot be negative' });
    }
    if (
      discountPercentage !== undefined &&
      (Number(discountPercentage) < 0 ||
        Number(discountPercentage) > 100)
    ) {
      return res.status(400).json({
        message: 'Discount percentage must be between 0 and 100.'
      });
    }

    let parsedAdditionalInfo;
    if (additionalInfo !== undefined) {
      let rawInfo = additionalInfo;
      if (typeof additionalInfo === 'string') {
        try {
          rawInfo = JSON.parse(additionalInfo);
        } catch (e) {
          console.error('Error parsing additionalInfo:', e);
          rawInfo = [];
        }
      }
      if (Array.isArray(rawInfo)) {
        parsedAdditionalInfo = rawInfo
          .map(item => ({
            heading: (item.heading || '').trim(),
            details: (item.details || item.description || '').trim()
          }))
          .filter(item => item.heading !== '' || item.details !== '');
      } else {
        parsedAdditionalInfo = [];
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
    product.price = price !== undefined && price !== '' ? Number(price) : product.price;
    product.category = category || product.category;
    product.countInStock = countInStock !== undefined && countInStock !== '' ? Number(countInStock) : product.countInStock;
    if (lowStockThreshold !== undefined && lowStockThreshold !== '') {
      product.lowStockThreshold = Number(lowStockThreshold);
    }
    product.brand = brand || product.brand;
    product.sku = sku || product.sku;
    product.discountPercentage =
      discountPercentage !== undefined
        ? Number(discountPercentage)
        : product.discountPercentage;
    if (parsedAdditionalInfo !== undefined) product.additionalInfo = parsedAdditionalInfo;

    if (Object.prototype.hasOwnProperty.call(updatePolicyReferences, 'shippingPolicyId')) {
      product.shippingPolicyId = updatePolicyReferences.shippingPolicyId;
    }

    if (Object.prototype.hasOwnProperty.call(updatePolicyReferences, 'guaranteePolicyId')) {
      product.guaranteePolicyId = updatePolicyReferences.guaranteePolicyId;
    }

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

    if (!Array.isArray(imagesToDelete)) imagesToDelete = [];
    // Only images that actually belong to this product can be removed
    const removedImages = product.images.filter(img => imagesToDelete.includes(img));
    const keptImages = product.images.filter(img => !imagesToDelete.includes(img));

    const files = Array.isArray(req.files) ? req.files : [];
    if (keptImages.length + files.length > MAX_PRODUCT_IMAGES) {
      return res.status(400).json({ message: `A product can have at most ${MAX_PRODUCT_IMAGES} images.` });
    }
    const uploadedImages = await saveImages(files, 'products');
    product.images = [...keptImages, ...uploadedImages];

    let updatedProduct;
    try {
      updatedProduct = await product.save();
    } catch (saveErr) {
      await deleteUnusedProductImages(uploadedImages);
      throw saveErr;
    }
    // Clean up removed images only after the product was saved successfully
    await deleteUnusedProductImages(removedImages);
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
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
    const seller = req.seller || await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    if (seller.status === 'suspended') {
      return res.status(403).json({ message: 'Your seller account is suspended. Please contact Hope for Paws support.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: 'Product not found' });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.sellerId.toString() !== seller._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    const images = [...(product.images || [])];
    await product.deleteOne();
    await deleteUnusedProductImages(images);
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
    const seller = await Seller.findOne({ userId }).select('_id status').lean();
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    // A suspended seller can't put products back on the marketplace
    if (seller.status === 'suspended') {
      return res.status(403).json({ message: 'Your seller account is suspended. Please contact Hope for Paws support.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: 'Product not found' });

    // 2. Fast lean lookup to get current status
    const currentProduct = await Product.findOne({ _id: id, sellerId: seller._id }).select('status').lean();
    if (!currentProduct) return res.status(404).json({ message: 'Product not found or not authorized' });

    const newStatus = currentProduct.status === 'hidden' ? 'active' : 'hidden';
    const newVisibility = newStatus === 'active';

    // 3. Atomic direct update - avoids loading huge objects, skips pre-save overhead, incredibly fast
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { status: newStatus, isVisible: newVisibility, hiddenBySuspension: false } },
      { new: true, runValidators: true }
    );

    res.json({ message: `Product is now ${newStatus}`, product: updatedProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record a public share. No login is required because product links are public.
exports.shareProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true, select: 'shareCount' }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ shareCount: product.shareCount });
  } catch (err) {
    console.error('Error recording product share:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Seller-specific custom categories for product creation.
exports.listMyProductCategories = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const seller = await Seller.findOne({ userId }).select('_id').lean();
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const products = await Product.find({ sellerId: seller._id }).select('category').lean();
    const categories = [...new Set(
      products
        .map(product => product.category?.trim())
        .filter(category => category)
    )].sort((first, second) => first.localeCompare(second));

    return res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};