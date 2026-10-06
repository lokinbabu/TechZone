const express = require('express');
const cors = require('cors');
const path = require('path');
// Load .env relative to the server package so startup works from any cwd
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { authLimiter } = require('./middleware/rateLimit');

const app = express();

// ---- Global middleware ----
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Small request logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const t0 = Date.now();
    res.on('finish', () => {
      if (req.originalUrl.startsWith('/api')) {
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - t0}ms)`);
      }
    });
    next();
  });
}

// ---- API routes ----
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'TechZone API is running', time: new Date().toISOString() })
);
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/customers', require('./routes/customer.routes'));

// ---- 404 + central error handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Start ----
const rawPort = Number(process.env.PORT);
const PORT = Number.isInteger(rawPort) && rawPort > 0 && rawPort < 65536 ? rawPort : 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`⚡ TechZone API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('\n✖ Failed to start TechZone API:');
    console.error(err.message);
    console.error('\nChecklist:');
    console.error('  1. Is MongoDB running? (mongod) or using an Atlas URI?');
    console.error('  2. Did you copy server/.env.example → server/.env and set MONGO_URI?');
    console.error(`  Current MONGO_URI: ${process.env.MONGO_URI || '(not set)'}\n`);
    process.exit(1);
  }
};

start();
