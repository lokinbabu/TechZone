const Product = require('../models/product.model');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateProduct } = require('../utils/validation');

const FALLBACK_IMAGE = Product.FALLBACK_IMAGE;

// lean() results skip virtuals — attach discountPercent manually
const withDiscount = (p) => ({
  ...p,
  discountPercent:
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0,
});

const normalizeProductPayload = (body) => {
  const data = {
    name: String(body.name || '').trim(),
    brand: String(body.brand || '').trim(),
    category: String(body.category || '').trim(),
    price: Number(body.price),
    originalPrice:
      body.originalPrice === null || body.originalPrice === undefined || body.originalPrice === ''
        ? null
        : Number(body.originalPrice),
    description: String(body.description || '').trim(),
    rating: body.rating === undefined || body.rating === null || body.rating === ''
      ? undefined
      : Math.min(5, Math.max(0, Number(body.rating))),
    stock: Number(body.stock ?? 0),
    isFeatured: Boolean(body.isFeatured),
    isTrending: Boolean(body.isTrending),
  };

  // Images: keep non-empty strings; guarantee at least the fallback
  let images = Array.isArray(body.images)
    ? body.images.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (images.length === 0) images = [FALLBACK_IMAGE];
  data.images = images;

  // Specifications: keep rows that have both a label and a value
  if (Array.isArray(body.specifications)) {
    data.specifications = body.specifications
      .map((s) => ({
        label: String(s?.label || '').trim(),
        value: String(s?.value || '').trim(),
      }))
      .filter((s) => s.label && s.value);
  }

  return data;
};

// GET /api/products — supports search, filters, sorting, pagination
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, brand, minPrice, maxPrice, rating, inStock, sort } = req.query;

  const query = {};
  if (search && String(search).trim()) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (category && category !== 'All') query.category = String(category);
  if (brand && brand !== 'All') query.brand = String(brand);

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice)))
    priceFilter.$gte = Number(minPrice);
  if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice)))
    priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length) query.price = priceFilter;

  if (rating && !Number.isNaN(Number(rating)) && Number(rating) > 0)
    query.rating = { $gte: Number(rating) };

  if (inStock === 'true') query.stock = { $gt: 0 };

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    newest: { createdAt: -1 },
    name: { name: 1 },
    featured: { isFeatured: -1, rating: -1 },
  };
  const sortOption = sortMap[sort] || sortMap.featured;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 24));

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOption).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products: products.map(withDiscount),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// GET /api/products/meta — distinct categories & brands for filter UI
const getProductMeta = asyncHandler(async (req, res) => {
  const [categories, brands] = await Promise.all([
    Product.distinct('category'),
    Product.distinct('brand'),
  ]);
  res.json({
    success: true,
    categories: categories.sort(),
    brands: brands.sort(),
  });
});

// GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true })
    .sort({ rating: -1 })
    .limit(8)
    .lean();
  res.json({ success: true, products: products.map(withDiscount) });
});

// GET /api/products/trending
const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isTrending: true })
    .sort({ rating: -1 })
    .limit(8)
    .lean();
  res.json({ success: true, products: products.map(withDiscount) });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product: withDiscount(product) });
});

// POST /api/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const errors = validateProduct(req.body || {});
  if (errors) {
    return res.status(400).json({ success: false, message: 'Please fix the highlighted fields', errors });
  }
  const product = await Product.create(normalizeProductPayload(req.body));
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const errors = validateProduct(req.body || {});
  if (errors) {
    return res.status(400).json({ success: false, message: 'Please fix the highlighted fields', errors });
  }

  Object.assign(product, normalizeProductPayload(req.body));
  await product.save();
  res.json({ success: true, product });
});

// PATCH /api/products/:id/stock (admin) — quick stock/price update
const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body || {};
  if (stock === undefined || !Number.isFinite(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ success: false, message: 'Stock must be a number ≥ 0' });
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: Number(stock) },
    { new: true }
  );
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// DELETE /api/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
});

// GET /api/products/recommended (auth) — simple recommendation feed
const getRecommended = asyncHandler(async (req, res) => {
  const topCats = await Product.aggregate([
    { $match: { stock: { $gt: 0 } } },
    { $sort: { rating: -1 } },
    { $group: { _id: '$category', product: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$product' } },
    { $limit: 8 },
  ]);
  res.json({ success: true, products: topCats });
});

module.exports = {
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
};
