// Usage:
//   npm run seed          → adds demo data (skips if products already exist)
//   npm run seed:fresh    → wipes users, products and orders, then re-imports
//   node src/seeder/seed.js --destroy → empties the collections only
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { products, users } = require('./data');

const DAYS = 24 * 60 * 60 * 1000;

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Deterministic demo orders so the admin dashboard is never empty
const demoOrders = [
  {
    email: 'user@techzone.com',
    items: [
      { name: 'RGB Mechanical Keyboard', qty: 1 },
      { name: 'Braided USB-C Cable 2m', qty: 2 },
    ],
    status: 'Delivered',
    daysAgo: 12,
  },
  {
    email: 'user@techzone.com',
    items: [
      { name: '27-inch 144Hz Monitor', qty: 1 },
      { name: 'Wireless Gaming Mouse', qty: 1 },
    ],
    status: 'Shipped',
    daysAgo: 6,
  },
  {
    email: 'priya@example.com',
    items: [{ name: 'ANC Headphones', qty: 1 }],
    status: 'Processing',
    daysAgo: 3,
  },
  {
    email: 'priya@example.com',
    items: [
      { name: 'TechZone Phantom X Gaming Laptop', qty: 1 },
      { name: 'Gaming Mousepad XL', qty: 1 },
    ],
    status: 'Placed',
    daysAgo: 1,
  },
  {
    email: 'priya@example.com',
    items: [{ name: 'TKL Mechanical Keyboard', qty: 1 }],
    status: 'Cancelled',
    daysAgo: 9,
  },
];

const buildDemoOrders = async () => {
  const productDocs = await Product.find({});
  const bySlug = new Map(productDocs.map((p) => [slugify(p.name), p]));
  const userDocs = await User.find({ role: 'user' });
  const userByEmail = new Map(userDocs.map((u) => [u.email, u]));

  const orders = [];
  for (const spec of demoOrders) {
    const user = userByEmail.get(spec.email);
    if (!user) continue;

    const items = [];
    let ok = true;
    for (const it of spec.items) {
      const doc = bySlug.get(slugify(it.name));
      if (!doc) {
        ok = false;
        break;
      }
      items.push({
        product: doc._id,
        name: doc.name,
        brand: doc.brand,
        image: doc.images[0],
        price: doc.price,
        qty: it.qty,
      });
    }
    if (!ok || items.length === 0) continue;

    const itemsPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryCharge = itemsPrice >= 999 ? 0 : 49;

    orders.push({
      user: user._id,
      items,
      customer: {
        fullName: user.name,
        phone: '9876543210',
        addressLine: '42 Neon Avenue, Sector 7',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      },
      itemsPrice,
      deliveryCharge,
      totalAmount: itemsPrice + deliveryCharge,
      paymentMethod: 'Cash on Delivery',
      status: spec.status,
      createdAt: new Date(Date.now() - spec.daysAgo * DAYS),
    });
  }
  return orders;
};

const seed = async () => {
  await connectDB();

  const mode = process.argv[2] || '';
  const destroyOnly = mode === '--destroy';

  if (mode === '--fresh' || destroyOnly) {
    console.log('⚠  Clearing existing users, products and orders…');
    await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
    if (destroyOnly) {
      console.log('✔ Collections cleared.');
      process.exit(0);
    }
  }

  // ---- Admin ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@techzone.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'TechZone Admin';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: adminName, email: adminEmail, password: adminPassword, role: 'admin' });
    console.log(`✔ Demo admin created → ${adminEmail}`);
  } else {
    admin.role = 'admin';
    await admin.save();
    console.log(`✔ Demo admin already exists → ${adminEmail}`);
  }

  // ---- Products ----
  const existingProducts = await Product.countDocuments();
  if (existingProducts > 0 && mode !== '--fresh') {
    console.log(`ℹ  ${existingProducts} products already exist — skipping product import (use --fresh to wipe & re-import).`);
  } else if (mode === '--fresh') {
    const created = await Product.insertMany(products);
    console.log(`✔ Imported ${created.length} products.`);
  }

  // ---- Demo customers ----
  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      console.log(`✔ Demo customer created → ${u.email}`);
    }
  }

  // ---- Demo orders (only alongside a fresh product import) ----
  if (mode === '--fresh') {
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      const orders = await buildDemoOrders();
      if (orders.length) {
        await Order.insertMany(orders);
        console.log(`✔ Imported ${orders.length} demo orders.`);
      }
    }
  }

  console.log('\n✅ Seeding complete.');
  console.log(`   Admin login → ${adminEmail} / ${adminPassword}`);
  console.log('   Customer    → user@techzone.com / User@123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('✖ Seeding failed:', err.message);
  process.exit(1);
});
