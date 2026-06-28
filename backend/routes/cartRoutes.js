const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { preventSellerAccess } = require('../middleware/roleCheck');
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(auth);
router.use(preventSellerAccess);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateQuantity);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
