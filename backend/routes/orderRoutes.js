const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder } = require('../controllers/orderController');

// All order routes require authentication
router.use(auth);

// Map POST /api/orders to createOrder
router.post('/', createOrder);

module.exports = router;
