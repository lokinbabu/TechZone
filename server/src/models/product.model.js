const mongoose = require('mongoose');

// Every product keeps a local fallback so a broken/missing remote image
// can never destroy the layout on the frontend.
const FALLBACK_IMAGE = '/images/products/fallback.svg';

const specificationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [160, 'Name cannot exceed 160 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      maxlength: 60,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: 60,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    images: {
      type: [String],
      default: [FALLBACK_IMAGE],
      validate: {
        validator: (v) => !v || v.length === 0 || v.every((s) => typeof s === 'string'),
        message: 'Images must be an array of strings',
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    numReviews: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    specifications: { type: [specificationSchema], default: [] },
  },
  { timestamps: true }
);

// Useful indexes for the shop filters
productSchema.index({ name: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

productSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.statics.FALLBACK_IMAGE = FALLBACK_IMAGE;

module.exports = mongoose.model('Product', productSchema);
