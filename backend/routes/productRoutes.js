const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProduct,
  listProducts,
  listMyProducts
} = require('../controllers/productController');

router.get('/', listProducts);
router.get('/mine', auth, listMyProducts);
router.post('/', auth, createProduct);

module.exports = router;
