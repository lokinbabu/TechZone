const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Authenticated user routes
router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

// Owner-or-admin detail route last
router.get('/:id', protect, getOrderById);

module.exports = router;
