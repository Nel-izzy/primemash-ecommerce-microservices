const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Customer ID is required'],
      index: true
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
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
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'GBP']
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet', 'cash'],
      default: 'card'
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentGateway: {
      type: String,
      default: 'demo_gateway'
    },
    // Simulated payment processing details
    processingDetails: {
      initiatedAt: Date,
      completedAt: Date,
      attemptCount: {
        type: Number,
        default: 1
      },
      lastError: String
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

// Virtual for payment duration
paymentSchema.virtual('processingDuration').get(function () {
  if (this.processingDetails?.initiatedAt && this.processingDetails?.completedAt) {
    return this.processingDetails.completedAt - this.processingDetails.initiatedAt;
  }
  return null;
});

// Index for querying payments by customer and status
paymentSchema.index({ customerId: 1, paymentStatus: 1 });

// Index for transaction reference lookup
paymentSchema.index({ transactionReference: 1 });

// Pre-validate middleware to generate transaction reference
paymentSchema.pre('validate', function(next) {
  if (!this.transactionReference) {
    // Generate reference: TXN-TIMESTAMP-RANDOM
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.transactionReference = `TXN-${timestamp}-${random}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;