const axios = require('axios');
const logger = require('../config/logger');

class ServiceClient {
  constructor() {
    this.customerServiceUrl = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:5001';
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002';
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';
  }

  /**
   * Validate customer exists and is active
   */
  async validateCustomer(customerId) {
    try {
      logger.info(`Validating customer: ${customerId}`);
      
      const response = await axios.get(
        `${this.customerServiceUrl}/api/customers/${customerId}`,
        { timeout: 5000 }
      );

      if (response.data.status === 'success') {
        logger.info(`Customer validated: ${customerId}`);
        return {
          isValid: true,
          customer: response.data.data.customer
        };
      }

      return { isValid: false, error: 'Customer validation failed' };
    } catch (error) {
      logger.error('Customer validation error', {
        customerId,
        error: error.message,
        response: error.response?.data
      });

      if (error.response?.status === 404) {
        return { isValid: false, error: 'Customer not found' };
      }

      if (error.response?.status === 403) {
        return { isValid: false, error: 'Customer account is inactive' };
      }

      return { isValid: false, error: 'Customer service unavailable' };
    }
  }

  /**
   * Validate product exists and has sufficient stock
   */
  async validateProduct(productId, quantity = 1) {
    try {
      logger.info(`Validating product: ${productId}, quantity: ${quantity}`);

      // First, get product details
      const productResponse = await axios.get(
        `${this.productServiceUrl}/api/products/${productId}`,
        { timeout: 5000 }
      );

      if (productResponse.data.status !== 'success') {
        return { isValid: false, error: 'Product validation failed' };
      }

      const product = productResponse.data.data.product;

      // Check availability
      const availabilityResponse = await axios.get(
        `${this.productServiceUrl}/api/products/${productId}/availability?quantity=${quantity}`,
        { timeout: 5000 }
      );

      if (availabilityResponse.data.status !== 'success') {
        return { isValid: false, error: 'Product availability check failed' };
      }

      const availability = availabilityResponse.data.data;

      if (!availability.canFulfill) {
        return {
          isValid: false,
          error: `Insufficient stock. Available: ${availability.availableStock}, Requested: ${quantity}`,
          product
        };
      }

      logger.info(`Product validated: ${productId}`);
      return {
        isValid: true,
        product,
        availability
      };
    } catch (error) {
      logger.error('Product validation error', {
        productId,
        quantity,
        error: error.message,
        response: error.response?.data
      });

      if (error.response?.status === 404) {
        return { isValid: false, error: 'Product not found' };
      }

      return { isValid: false, error: 'Product service unavailable' };
    }
  }

  /**
   * Initiate payment via Payment Service
   */
  async initiatePayment(paymentData) {
    try {
      logger.info('Initiating payment', { orderId: paymentData.orderId });

      const response = await axios.post(
        `${this.paymentServiceUrl}/api/payments`,
        paymentData,
        { timeout: 10000 }
      );

      if (response.data.status === 'success') {
        logger.info('Payment initiated successfully', {
          orderId: paymentData.orderId,
          paymentId: response.data.data.payment.id
        });
        return {
          success: true,
          payment: response.data.data.payment
        };
      }

      return { success: false, error: 'Payment initiation failed' };
    } catch (error) {
      logger.error('Payment initiation error', {
        orderId: paymentData.orderId,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.response?.data?.message || 'Payment service unavailable'
      };
    }
  }
}

module.exports = new ServiceClient();