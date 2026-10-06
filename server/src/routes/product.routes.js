const express = require('express');
const {
  getProducts,
  getProductMeta,
  getFeaturedProducts,
  getTrendingProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getRecommended,
} = require('../controllers/product.controller');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public catalog routes (declared before any /:id route)
router.get('/', getProducts);
router.get('/meta', getProductMeta);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);

// Authenticated user routes
router.get('/recommended', protect, getRecommended);

// Admin CRUD
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.patch('/:id/stock', protect, adminOnly, updateStock);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Public detail route last
router.get('/:id', getProductById);

module.exports = router;
