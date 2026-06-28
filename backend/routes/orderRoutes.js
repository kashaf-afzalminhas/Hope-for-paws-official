const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { preventSellerAccess } = require('../middleware/roleCheck');
const orderController = require('../controllers/orderController');

// All order routes require authentication
router.use(auth);

// Buyer Routes
router.post('/', preventSellerAccess, orderController.createOrder);
router.get('/buyer', preventSellerAccess, orderController.getBuyerOrders);
router.put('/:id/cancel', preventSellerAccess, orderController.cancelOrder);

// Seller Routes
router.get('/seller', orderController.getSellerOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/seller/stats', orderController.getDashboardStats);

module.exports = router;
