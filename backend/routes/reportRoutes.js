const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// All report routes require authentication
router.use(auth);

// POST /api/reports/product (Buyer)
router.post('/product', reportController.createProductReport);

// GET /api/reports/admin/products (Admin)
router.get('/admin/products', reportController.getReportedProducts);

// PUT /api/reports/admin/products/:productId/reinstate (Admin)
router.put('/admin/products/:productId/reinstate', reportController.reinstateProduct);

module.exports = router;
