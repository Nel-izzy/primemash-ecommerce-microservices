const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Product description must be at least 10 characters'],
      maxlength: [1000, 'Product description cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(value) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Price must be a valid positive number'
      }
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
      enum: {
        values: ['NGN', 'USD', 'EUR', 'GBP'],
        message: '{VALUE} is not a supported currency'
      }
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      enum: {
        values: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Food & Beverages', 'Beauty', 'Toys', 'Automotive', 'Other'],
        message: '{VALUE} is not a valid category'
      },
      index: true
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer'
      }
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'],
      index: true
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters']
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(images) {
          return images.length <= 5;
        },
        message: 'Maximum 5 images allowed per product'
      }
    },
    specifications: {
      type: Map,
      of: String,
      default: new Map()
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= 10) return 'low_stock';
  return 'in_stock';
});

// Virtual for availability
productSchema.virtual('isInStock').get(function () {
  return this.isAvailable && this.stock > 0;
});

// Index for text search
productSchema.index({ name: 'text', description: 'text' });

// Compound index for category and availability queries
productSchema.index({ category: 1, isAvailable: 1 });

// Pre-save middleware to ensure stock consistency
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;