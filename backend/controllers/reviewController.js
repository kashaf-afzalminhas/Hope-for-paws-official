const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Recalculate and cache a product's average rating and total review count.
 * Uses MongoDB aggregation for accuracy, then writes the result atomically.
 */
const recalcProductReviewStats = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
    numReviews: stats ? stats.numReviews : 0
  });
};

/**
 * POST /api/reviews
 * Create a review for a delivered order item.
 *
 * Security Gates:
 *   1. Ownership & Status — caller must own the order AND order must be Delivered.
 *   2. Duplication Lock  — one review per order (enforced at app + DB level).
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { orderId, productId, rating, comment, images } = req.body;

    // ── Validate required fields ──
    if (!orderId || !productId || !rating || !comment) {
      return res.status(400).json({
        message: 'orderId, productId, rating, and comment are all required'
      });
    }

    // ── Security Gate 1: Ownership & Delivery Status ──
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: you do not own this order' });
    }

    if (order.status !== 'Delivered') {
      return res.status(403).json({
        message: `Cannot review an order with status "${order.status}". Only delivered orders can be reviewed.`
      });
    }

    // Verify the product actually belongs to this order
    const orderContainsProduct = order.items.some(
      (item) => item.productId.toString() === productId
    );
    if (!orderContainsProduct) {
      return res.status(400).json({
        message: 'This product is not part of the specified order'
      });
    }

    // ── Security Gate 2: Duplication Lock (app-level check) ──
    const existingReview = await Review.findOne({ order: orderId }).lean();
    if (existingReview) {
      return res.status(400).json({ message: 'This order has already been reviewed' });
    }

    // ── Save the review ──
    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating: Number(rating),
      comment: comment.trim(),
      images: images || []
    });

    // ── Recalculate product stats ──
    await recalcProductReviewStats(review.product);

    // Populate user info for the response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username profileImage')
      .lean();

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: populatedReview
    });
  } catch (err) {
    // Handle the unique-index duplicate key error (race-condition safety net)
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This order has already been reviewed' });
    }
    console.error('createReview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/reviews/product/:productId
 * Fetch all reviews for a given product, newest first.
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(reviews);
  } catch (err) {
    console.error('getProductReviews error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/reviews/check/:orderId
 * Check if a review already exists for a specific order.
 * Used by the frontend to conditionally show/hide the "Write Review" button.
 */
exports.checkOrderReviewed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ order: orderId }).select('_id').lean();
    return res.json({ reviewed: !!review });
  } catch (err) {
    console.error('checkOrderReviewed error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
