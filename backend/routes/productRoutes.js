const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProduct,
  listProducts,
  listMyProducts,
  getProductById, // ✅ Import this
  shareProduct,
  updateProduct,  // ✅ Import this
  deleteProduct   // ✅ Import this
} = require('../controllers/productController');

// List & Create
router.get('/', listProducts);
router.post('/', auth, createProduct);

// Seller Dashboard
router.get('/mine', auth, listMyProducts);
router.post('/:id/share', shareProduct);

// ✅ Single Product Operations (Get, Update, Delete)
// Note: These will use the URL /products/:id
router.get('/:id', getProductById);   
router.put('/:id', auth, updateProduct); 
router.delete('/:id', auth, deleteProduct);

module.exports = router;