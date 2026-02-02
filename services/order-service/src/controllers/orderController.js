const Order = require('../models/Order');
const serviceClient = require('../utils/serviceClient');
const logger = require('../config/logger');

class OrderController {
  /**
   * Create new order - Main orchestration flow
   */
  async createOrder(req, res, next) {
    try {
      const { customerId, productId, quantity = 1 } = req.body;

      logger.info('Creating new order', { customerId, productId, quantity });

      // Step 1: Validate customer
      const customerValidation = await serviceClient.validateCustomer(customerId);
      if (!customerValidation.isValid) {
        logger.warn('Customer validation failed', { customerId, error: customerValidation.error });
        return res.status(400).json({
          status: 'fail',
          message: customerValidation.error
        });
      }

      // Step 2: Validate product and stock
      const productValidation = await serviceClient.validateProduct(productId, quantity);
      if (!productValidation.isValid) {
        logger.warn('Product validation failed', { productId, error: productValidation.error });
        return res.status(400).json({
          status: 'fail',
          message: productValidation.error
        });
      }

      const { customer } = customerValidation;
      const { product } = productValidation;

      // Step 3: Calculate amount
      const amount = product.price * quantity;

      // Step 4: Create order with pending status
      const order = new Order({
        customerId,
        productId,
        quantity,
        amount: product.price,
        currency: product.currency,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        customerInfo: {
          email: customer.email,
          name: customer.fullName
        },
        productInfo: {
          name: product.name,
          sku: product.sku,
          price: product.price
        }
      });

      await order.save();
      logger.info('Order created', { orderId: order.orderId, orderDbId: order._id });

      // Step 5: Initiate payment
      const paymentResult = await serviceClient.initiatePayment({
        customerId,
        orderId: order.orderId,
        amount: amount,
        currency: product.currency,
        productId
      });

      if (paymentResult.success) {
        // Update order with payment info
        order.paymentId = paymentResult.payment.id;
        order.orderStatus = 'processing';
        order.paymentStatus = 'processing';
        await order.save();

        logger.info('Order processing', { orderId: order.orderId, paymentId: order.paymentId });

        // CRITICAL: Deduct stock after successful payment
        const stockDeduction = await serviceClient.deductStock(
          productId,
          quantity,
          order.orderId
        );

        if (!stockDeduction.success) {
          logger.error('Stock deduction failed after payment', {
            orderId: order.orderId,
            productId,
            quantity,
            error: stockDeduction.error
          });
          // Payment succeeded but stock deduction failed
          // In production: initiate refund or manual reconciliation
          // For now: log the error but continue (order status remains 'processing')
        } else {
          logger.info('Stock deducted successfully', {
            orderId: order.orderId,
            productId,
            quantityDeducted: quantity,
            newStock: stockDeduction.data.newStock
          });
        }
      } else {
        // Payment initiation failed - keep order as pending
        logger.warn('Payment initiation failed', { orderId: order.orderId, error: paymentResult.error });
      }

      // Step 6: Return response to customer
      res.status(201).json({
        status: 'success',
        message: 'Order created successfully',
        data: {
          order: {
            customerId: order.customerId,
            orderId: order.orderId,
            productId: order.productId,
            quantity: order.quantity,
            amount: order.amount,
            totalAmount: order.totalAmount,
            currency: order.currency,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error creating order', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;

      logger.info(`Fetching order: ${id}`);

      const order = await Order.findById(id);

      if (!order) {
        logger.warn(`Order not found: ${id}`);
        return res.status(404).json({
          status: 'fail',
          message: 'Order not found'
        });
      }

      logger.info(`Order retrieved: ${id}`);

      res.status(200).json({
        status: 'success',
        data: {
          order: {
            id: order._id,
            customerId: order.customerId,
            orderId: order.orderId,
            productId: order.productId,
            quantity: order.quantity,
            amount: order.amount,
            totalAmount: order.totalAmount,
            currency: order.currency,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId,
            customerInfo: order.customerInfo,
            productInfo: order.productInfo,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching order', { error: error.message });
      next(error);
    }
  }

  /**
   * Get order by orderId (the generated order reference)
   */
  async getOrderByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;

      logger.info(`Fetching order by orderId: ${orderId}`);

      const order = await Order.findOne({ orderId });

      if (!order) {
        logger.warn(`Order not found: ${orderId}`);
        return res.status(404).json({
          status: 'fail',
          message: 'Order not found'
        });
      }

      logger.info(`Order retrieved: ${orderId}`);

      res.status(200).json({
        status: 'success',
        data: {
          order: {
            id: order._id,
            customerId: order.customerId,
            orderId: order.orderId,
            productId: order.productId,
            quantity: order.quantity,
            amount: order.amount,
            totalAmount: order.totalAmount,
            currency: order.currency,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId,
            customerInfo: order.customerInfo,
            productInfo: order.productInfo,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching order', { error: error.message });
      next(error);
    }
  }

  /**
   * Get all orders with optional filtering
   */
  async getAllOrders(req, res, next) {
    try {
      const { customerId, orderStatus, limit = 50 } = req.query;
      const filter = {};

      if (customerId) filter.customerId = customerId;
      if (orderStatus) filter.orderStatus = orderStatus;

      logger.info('Fetching orders', { filter, limit });

      const orders = await Order.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
          orders
        }
      });
    } catch (error) {
      logger.error('Error fetching orders', { error: error.message });
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

      // Check connectivity to other services
      const services = {
        customer: 'unknown',
        product: 'unknown',
        payment: 'unknown'
      };

      res.status(200).json({
        status: 'success',
        service: 'order-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        dependencies: services
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'order-service',
        message: 'Service unavailable'
      });
    }
  }
}

module.exports = new OrderController();