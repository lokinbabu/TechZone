const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateOrder } = require('../utils/validation');

const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 999;
const FALLBACK = '/images/products/fallback.svg';

const computeDelivery = (itemsPrice) =>
  itemsPrice >= FREE_DELIVERY_THRESHOLD || itemsPrice === 0 ? 0 : DELIVERY_FEE;

// POST /api/orders (auth) — place an order from the cart
const createOrder = asyncHandler(async (req, res) => {
  const errors = validateOrder(req.body || {});
  if (errors) {
    return res.status(400).json({ success: false, message: 'Please fix the highlighted fields', errors });
  }

  const cartItems = req.body.items;
  const ids = [...new Set(cartItems.map((i) => String(i.product)))];

  const dbProducts = await Product.find({ _id: { $in: ids } });
  const byId = new Map(dbProducts.map((p) => [String(p._id), p]));

  // Validate each item against the live database (never trust client prices)
  const orderItems = [];
  for (const item of cartItems) {
    const product = byId.get(String(item.product));
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `A product in your cart is no longer available`,
      });
    }
    const qty = Math.floor(Number(item.qty));
    if (!Number.isFinite(qty) || qty < 1) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid quantity for "${product.name}"` });
    }
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? `"${product.name}" is out of stock`
            : `Only ${product.stock} unit(s) of "${product.name}" left in stock`,
      });
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      brand: product.brand,
      image: product.images?.[0] || FALLBACK,
      price: product.price,
      qty,
    });
  }

  const itemsPrice = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryCharge = computeDelivery(itemsPrice);
  const totalAmount = itemsPrice + deliveryCharge;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    customer: req.body.customer,
    itemsPrice,
    deliveryCharge,
    totalAmount,
    paymentMethod: 'Cash on Delivery',
    status: 'Placed',
  });

  // Decrement stock atomically (guard against overselling)
  await Promise.all(
    orderItems.map((i) =>
      Product.updateOne({ _id: i.product, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty } })
    )
  );

  res.status(201).json({ success: true, order });
});

// GET /api/orders/mine (auth)
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// GET /api/orders/:id (auth) — owner or admin
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
  }
  res.json({ success: true, order });
});

// PUT /api/orders/:id/cancel (auth) — user cancels own order while Placed/Processing
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const isOwner = String(order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (!['Placed', 'Processing'].includes(order.status)) {
    return res
      .status(400)
      .json({ success: false, message: `An order that is ${order.status} can no longer be cancelled` });
  }

  // Return items to stock
  await Promise.all(
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } }))
  );
  order.status = 'Cancelled';
  await order.save();

  res.json({ success: true, order });
});

// GET /api/orders (admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status && status !== 'All' ? { status } : {};
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// PUT /api/orders/:id/status (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!Order.STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: `Status must be one of: ${Order.STATUSES.join(', ')}` });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const wasActive = ['Placed', 'Processing', 'Shipped'].includes(order.status);
  order.status = status;
  await order.save();

  // Adjust stock when an order is cancelled / restored
  if (status === 'Cancelled' && wasActive) {
    await Promise.all(
      order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } }))
    );
  } else if (wasActive === false && status !== 'Cancelled') {
    await Promise.all(
      order.items.map((i) =>
        Product.updateOne({ _id: i.product, stock: { $gte: i.qty } }, { $inc: { stock: -i.qty } })
      )
    );
  }

  res.json({ success: true, order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
