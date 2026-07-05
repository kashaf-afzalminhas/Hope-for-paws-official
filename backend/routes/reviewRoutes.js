const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createReview,
  getProductReviews,
  checkOrderReviewed
} = require('../controllers/reviewController');

// POST   /api/reviews          — Create a review (auth required)
router.post('/', auth, createReview);

// GET    /api/reviews/product/:productId — Get all reviews for a product (public)
router.get('/product/:productId', getProductReviews);

// GET    /api/reviews/check/:orderId — Check if an order has been reviewed (public)
router.get('/check/:orderId', checkOrderReviewed);

module.exports = router;
