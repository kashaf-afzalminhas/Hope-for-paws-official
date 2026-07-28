const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middleware/auth'); // Corrected import

// Apply authentication middleware to all wishlist routes
router.use(auth);

// GET /api/wishlist
router.get('/', wishlistController.getWishlist);

// POST /api/wishlist/toggle
router.post('/toggle', wishlistController.toggleWishlistItem);

module.exports = router;
