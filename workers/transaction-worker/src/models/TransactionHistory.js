const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      index: true
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      index: true
    },
    productId: {
      type: String,
      required: [true, 'Product ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN'
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true
    },
    paymentStatus: {
      type: String,
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'card'
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient queries by customer and date
transactionHistorySchema.index({ customerId: 1, timestamp: -1 });

// Index for transaction lookup
transactionHistorySchema.index({ transactionReference: 1 });

// Index for order transaction history
transactionHistorySchema.index({ orderId: 1, timestamp: -1 });

const TransactionHistory = mongoose.model('TransactionHistory', transactionHistorySchema);

module.exports = TransactionHistory;