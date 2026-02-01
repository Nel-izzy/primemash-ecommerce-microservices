const Customer = require('../models/Customer');
const logger = require('../config/logger');

class CustomerController {
  /**
   * Get customer by ID
   */
  async getCustomerById(req, res, next) {
    try {
      const { id } = req.params;

      logger.info(`Fetching customer with ID: ${id}`);

      const customer = await Customer.findById(id);

      if (!customer) {
        logger.warn(`Customer not found: ${id}`);
        return res.status(404).json({
          status: 'fail',
          message: 'Customer not found'
        });
      }

      if (!customer.isActive) {
        logger.warn(`Inactive customer accessed: ${id}`);
        return res.status(403).json({
          status: 'fail',
          message: 'Customer account is inactive'
        });
      }

      logger.info(`Customer retrieved successfully: ${id}`);

      res.status(200).json({
        status: 'success',
        data: {
          customer: {
            id: customer._id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            isActive: customer.isActive,
            createdAt: customer.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching customer', { error: error.message });
      next(error);
    }
  }

  /**
   * Get all customers (for testing/admin purposes)
   */
  async getAllCustomers(req, res, next) {
    try {
      const { isActive } = req.query;
      const filter = isActive !== undefined ? { isActive: isActive === 'true' } : {};

      logger.info('Fetching all customers', { filter });

      const customers = await Customer.find(filter).select('-__v');

      res.status(200).json({
        status: 'success',
        results: customers.length,
        data: {
          customers
        }
      });
    } catch (error) {
      logger.error('Error fetching customers', { error: error.message });
      next(error);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      // Check database connection
      const dbState = require('mongoose').connection.readyState;
      const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

      res.status(200).json({
        status: 'success',
        service: 'customer-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'customer-service',
        message: 'Service unavailable'
      });
    }
  }
}

module.exports = new CustomerController();