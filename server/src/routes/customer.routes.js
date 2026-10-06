const express = require('express');
const {
  getCustomers,
  getCustomerById,
} = require('../controllers/customer.controller');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, adminOnly, getCustomers);
router.get('/:id', protect, adminOnly, getCustomerById);

module.exports = router;
