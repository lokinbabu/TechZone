const User = require('../models/user.model');
const Order = require('../models/order.model');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/customers (admin) — users with order counts and spend
const getCustomers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();

  const stats = await Order.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  const statsByUser = new Map(stats.map((s) => [String(s._id), s]));

  const customers = users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    orderCount: statsByUser.get(String(u._id))?.orderCount || 0,
    totalSpent: statsByUser.get(String(u._id))?.totalSpent || 0,
    lastOrderAt: statsByUser.get(String(u._id))?.lastOrderAt || null,
  }));

  res.json({ success: true, customers });
});

// GET /api/customers/:id (admin) — customer profile with their orders
const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    customer: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    orders,
  });
});

module.exports = { getCustomers, getCustomerById };
