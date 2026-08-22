const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middleware/auth'); // Corrected import

// Apply authentication middleware to all wishlist routes
router.use(auth);

// GET /api/wishlist
router.get('/', wishlistController.getWishlist);

// PUT /api/wishlist/view  <-- ADD THIS LINE HERE
router.put('/view', wishlistController.markWishlistAsViewed);

// POST /api/wishlist/toggle
router.post('/toggle', wishlistController.toggleWishlistItem);

// DELETE /api/wishlist/clear
router.delete('/clear', wishlistController.clearWishlist);

module.exports = router;
