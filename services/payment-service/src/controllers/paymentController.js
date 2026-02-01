const Payment = require('../models/Payment');
const rabbitmqPublisher = require('../utils/rabbitmqPublisher');
const logger = require('../config/logger');

class PaymentController {
  /**
   * Process payment - Demo/simplified implementation
   */
  async processPayment(req, res, next) {
    try {
      const { customerId, orderId, amount, currency = 'NGN', productId } = req.body;

      logger.info('Processing payment', { orderId, amount, currency });

      // Validate required fields
      if (!customerId || !orderId || !amount) {
        return res.status(400).json({
          status: 'fail',
          message: 'Missing required fields: customerId, orderId, amount'
        });
      }

      // Create payment record
      const payment = new Payment({
        customerId,
        orderId,
        productId,
        amount,
        currency,
        paymentStatus: 'processing',
        paymentMethod: 'card',
        paymentGateway: 'demo_gateway',
        processingDetails: {
          initiatedAt: new Date(),
          attemptCount: 1
        }
      });

      await payment.save();
      logger.info('Payment record created', {
        paymentId: payment._id,
        transactionReference: payment.transactionReference
      });

      // Simulate payment processing (in real-world, this would call a payment gateway)
      const paymentResult = await this.simulatePaymentProcessing(payment);

      if (paymentResult.success) {
        // Update payment status
        payment.paymentStatus = 'completed';
        payment.processingDetails.completedAt = new Date();
        await payment.save();

        logger.info('Payment completed successfully', {
          paymentId: payment._id,
          orderId
        });

        // Publish transaction to RabbitMQ for history tracking
        const transactionData = {
          customerId: payment.customerId.toString(),
          orderId: payment.orderId,
          productId: payment.productId.toString(),
          amount: payment.amount,
          currency: payment.currency,
          transactionReference: payment.transactionReference,
          paymentStatus: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          timestamp: new Date().toISOString()
        };

        const publishResult = await rabbitmqPublisher.publishTransaction(transactionData);

        if (!publishResult.success) {
          logger.warn('Failed to publish to RabbitMQ, but payment completed', {
            paymentId: payment._id,
            error: publishResult.error
          });
        }

        // Return success response
        return res.status(200).json({
          status: 'success',
          message: 'Payment processed successfully',
          data: {
            payment: {
              id: payment._id,
              customerId: payment.customerId,
              orderId: payment.orderId,
              amount: payment.amount,
              currency: payment.currency,
              paymentStatus: payment.paymentStatus,
              transactionReference: payment.transactionReference,
              paymentMethod: payment.paymentMethod,
              createdAt: payment.createdAt
            }
          }
        });
      } else {
        // Payment failed
        payment.paymentStatus = 'failed';
        payment.processingDetails.lastError = paymentResult.error;
        await payment.save();

        logger.warn('Payment failed', {
          paymentId: payment._id,
          orderId,
          error: paymentResult.error
        });

        return res.status(400).json({
          status: 'fail',
          message: 'Payment processing failed',
          error: paymentResult.error
        });
      }
    } catch (error) {
      logger.error('Error processing payment', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Simulate payment processing (Demo purposes only)
   * In production, this would integrate with actual payment gateway
   */
  async simulatePaymentProcessing(payment) {
    return new Promise((resolve) => {
      // Simulate processing delay (500ms - 1.5s)
      const delay = Math.random() * 1000 + 500;

      setTimeout(() => {
        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        if (success) {
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: 'Insufficient funds or card declined'
          });
        }
      }, delay);
    });
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req, res, next) {
    try {
      const { id } = req.params;

      logger.info(`Fetching payment: ${id}`);

      const payment = await Payment.findById(id);

      if (!payment) {
        logger.warn(`Payment not found: ${id}`);
        return res.status(404).json({
          status: 'fail',
          message: 'Payment not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          payment: {
            id: payment._id,
            customerId: payment.customerId,
            orderId: payment.orderId,
            productId: payment.productId,
            amount: payment.amount,
            currency: payment.currency,
            paymentStatus: payment.paymentStatus,
            transactionReference: payment.transactionReference,
            paymentMethod: payment.paymentMethod,
            paymentGateway: payment.paymentGateway,
            processingDetails: payment.processingDetails,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching payment', { error: error.message });
      next(error);
    }
  }

  /**
   * Get all payments with filtering
   */
  async getAllPayments(req, res, next) {
    try {
      const { customerId, paymentStatus, orderId } = req.query;
      const filter = {};

      if (customerId) filter.customerId = customerId;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (orderId) filter.orderId = orderId;

      logger.info('Fetching payments', { filter });

      const payments = await Payment.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(100);

      res.status(200).json({
        status: 'success',
        results: payments.length,
        data: {
          payments
        }
      });
    } catch (error) {
      logger.error('Error fetching payments', { error: error.message });
      next(error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const dbState = require('mongoose').connection.readyState;
      const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
      const rabbitmqStatus = rabbitmqPublisher.isReady() ? 'connected' : 'disconnected';

      res.status(200).json({
        status: 'success',
        service: 'payment-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        rabbitmq: rabbitmqStatus
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'payment-service',
        message: 'Service unavailable'
      });
    }
  }
}

module.exports = new PaymentController();