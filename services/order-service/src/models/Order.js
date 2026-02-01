const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Customer ID is required'],
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Product ID is required'],
      index: true
    },
    orderId: {
      type: String,
      unique: true,
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer'
      }
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'GBP']
    },
    orderStatus: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        message: '{VALUE} is not a valid order status'
      },
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed'],
      default: 'pending'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // Denormalized data for quick access (cached from Customer/Product services)
    customerInfo: {
      email: String,
      name: String
    },
    productInfo: {
      name: String,
      sku: String,
      price: Number
    },
    notes: {
      type: String,
      maxlength: 500
    },
    metadata: {
      type: Map,
      of: String,
      default: new Map()
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for total amount
orderSchema.virtual('totalAmount').get(function () {
  return this.amount * this.quantity;
});

// Virtual for order status display
orderSchema.virtual('statusDisplay').get(function () {
  return {
    order: this.orderStatus,
    payment: this.paymentStatus
  };
});

// Index for querying orders by customer
orderSchema.index({ customerId: 1, createdAt: -1 });

// Index for order status queries
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// Pre-validate middleware to generate orderId before validation runs
orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    // Generate orderId: ORD-TIMESTAMP-RANDOM
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;