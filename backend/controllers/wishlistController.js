const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * GET /api/wishlist
 * Fetches the wishlist for the authenticated user and populates the product details.
 */
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    // Use lean() for better performance since we only need to read the data
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate('products','title price images discountPercentage countInStock averageRating numReviews category sellerId')
      .lean();

    if (!wishlist) {
      return res.status(200).json({ products: [] });
    }

    return res.status(200).json({ products: wishlist.products });
  } catch (error) {
    console.error('getWishlist error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching wishlist' });
  }
};

/**
 * POST /api/wishlist/toggle
 * Toggles a product in the user's wishlist. Creates the wishlist if it doesn't exist.
 */
exports.toggleWishlistItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify the product actually exists
    const productExists = await Product.findById(productId).select('_id').lean();
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the user's wishlist or create it atomically using upsert
    // We use findOne to check the state, then update accordingly to ensure atomic behavior.
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Create new wishlist with the product
      wishlist = await Wishlist.create({
        user: userId,
        products: [productId]
      });
      return res.status(201).json({ 
        message: 'Product added to wishlist', 
        products: wishlist.products 
      });
    }

    // Check if product is already in the wishlist
    const productIndex = wishlist.products.indexOf(productId);
    
    if (productIndex > -1) {
      // Product exists, so we remove it
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      return res.status(200).json({ 
        message: 'Product removed from wishlist', 
        products: wishlist.products 
      });
    } else {
      // Product does not exist, so we add it
      wishlist.products.push(productId);
      await wishlist.save();
      return res.status(200).json({ 
        message: 'Product added to wishlist', 
        products: wishlist.products 
      });
    }
  } catch (error) {
    console.error('toggleWishlistItem error:', error);
    return res.status(500).json({ message: 'Internal server error while toggling wishlist item' });
  }
};
