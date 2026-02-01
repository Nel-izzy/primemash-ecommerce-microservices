const Product = require('../models/Product');
const logger = require('../config/logger');

class ProductController {
  /**
   * Get product by ID
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      logger.info(`Fetching product with ID: ${id}`);

      const product = await Product.findById(id);

      if (!product) {
        logger.warn(`Product not found: ${id}`);
        return res.status(404).json({
          status: 'fail',
          message: 'Product not found'
        });
      }

      if (!product.isAvailable) {
        logger.warn(`Unavailable product accessed: ${id}`);
      }

      logger.info(`Product retrieved successfully: ${id}`);

      res.status(200).json({
        status: 'success',
        data: {
          product: {
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            category: product.category,
            stock: product.stock,
            stockStatus: product.stockStatus,
            isInStock: product.isInStock,
            sku: product.sku,
            brand: product.brand,
            images: product.images,
            specifications: product.specifications,
            isAvailable: product.isAvailable,
            rating: product.rating,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching product', { error: error.message });
      next(error);
    }
  }

  /**
   * Get all products with optional filtering
   */
  async getAllProducts(req, res, next) {
    try {
      const { category, isAvailable, minPrice, maxPrice, inStock } = req.query;
      const filter = {};

      // Apply filters
      if (category) filter.category = category;
      if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
      if (inStock === 'true') {
        filter.stock = { $gt: 0 };
        filter.isAvailable = true;
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      logger.info('Fetching products', { filter });

      const products = await Product.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 });

      res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
          products
        }
      });
    } catch (error) {
      logger.error('Error fetching products', { error: error.message });
      next(error);
    }
  }

  /**
   * Check product availability and stock
   */
  async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity } = req.query;

      logger.info(`Checking availability for product: ${id}`);

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: 'Product not found'
        });
      }

      const requestedQty = quantity ? parseInt(quantity) : 1;
      const isAvailable = product.isAvailable && product.stock >= requestedQty;

      res.status(200).json({
        status: 'success',
        data: {
          productId: product._id,
          name: product.name,
          isAvailable,
          availableStock: product.stock,
          requestedQuantity: requestedQty,
          canFulfill: isAvailable
        }
      });
    } catch (error) {
      logger.error('Error checking availability', { error: error.message });
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
        service: 'product-service',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        service: 'product-service',
        message: 'Service unavailable'
      });
    }
  }
}

module.exports = new ProductController();