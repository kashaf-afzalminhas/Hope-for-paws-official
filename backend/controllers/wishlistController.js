const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * GET /api/wishlist
 * Fetches the wishlist for the authenticated user and populates product details.
 */
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate('products','title price images discountPercentage countInStock averageRating numReviews category sellerId')
      .lean();

    if (!wishlist) {
      return res.status(200).json({ products: [], unviewedCount: 0 });
    }

    const unviewedCount = wishlist.unviewedProducts ? wishlist.unviewedProducts.length : 0;

    return res.status(200).json({ 
      products: wishlist.products, 
      unviewedCount 
    });
  } catch (error) {
    console.error('getWishlist error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching wishlist' });
  }
};

/**
 * PUT /api/wishlist/view
 * Marks all items in the wishlist as viewed.
 */
exports.markWishlistAsViewed = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    // Clear the unviewedProducts array entirely when user views wishlist
    await Wishlist.findOneAndUpdate({ user: userId }, { unviewedProducts: [] });
    return res.status(200).json({ message: 'Wishlist marked as viewed' });
  } catch (error) {
    console.error('markWishlistAsViewed error:', error);
    return res.status(500).json({ message: 'Internal server error while updating wishlist status' });
  }
};

/**
 * POST /api/wishlist/toggle
 * Toggles a product in the user's wishlist.
 */
exports.toggleWishlistItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const productExists = await Product.findById(productId).select('_id').lean();
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Create new wishlist with product in both arrays
      wishlist = await Wishlist.create({
        user: userId,
        products: [productId],
        unviewedProducts: [productId]
      });

      // Populate product details before returning
      const populatedWishlist = await Wishlist.findById(wishlist._id)
        .populate('products', 'title price images discountPercentage countInStock averageRating numReviews category sellerId')
        .lean();

      return res.status(201).json({ 
        message: 'Product added to wishlist', 
        products: populatedWishlist.products,
        unviewedCount: 1
      });
    }

    // Ensure unviewedProducts array exists
    if (!wishlist.unviewedProducts) {
      wishlist.unviewedProducts = [];
    }

    const productIndex = wishlist.products.findIndex(id => id.toString() === productId.toString());
    
    if (productIndex > -1) {
      // Product exists -> REMOVE IT from products array
      wishlist.products.splice(productIndex, 1);
      
      // ONLY remove from unviewedProducts if it was actually unviewed
      const unviewedIndex = wishlist.unviewedProducts.findIndex(id => id.toString() === productId.toString());
      if (unviewedIndex > -1) {
        wishlist.unviewedProducts.splice(unviewedIndex, 1);
      }
    } else {
      // Product does not exist -> ADD IT
      wishlist.products.push(productId);
      wishlist.unviewedProducts.push(productId);
    }

    await wishlist.save();

    // Re-fetch populated wishlist so the frontend receives full product objects
    const populatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('products', 'title price images discountPercentage countInStock averageRating numReviews category sellerId')
      .lean();

    return res.status(200).json({ 
      message: productIndex > -1 ? 'Product removed from wishlist' : 'Product added to wishlist', 
      products: populatedWishlist.products,
      unviewedCount: populatedWishlist.unviewedProducts ? populatedWishlist.unviewedProducts.length : 0
    });

  } catch (error) {
    console.error('toggleWishlistItem error:', error);
    return res.status(500).json({ message: 'Internal server error while toggling wishlist item' });
  }
};

/**
 * DELETE /api/wishlist/clear
 * Removes all products from the user's wishlist.
 */
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(200).json({ message: 'Wishlist is already empty', products: [] });
    }

    wishlist.products = [];
    wishlist.unviewedProducts = [];
    await wishlist.save();

    return res.status(200).json({ message: 'Wishlist cleared successfully', products: [] });
  } catch (error) {
    console.error('clearWishlist error:', error);
    return res.status(500).json({ message: 'Internal server error while clearing wishlist' });
  }
};
