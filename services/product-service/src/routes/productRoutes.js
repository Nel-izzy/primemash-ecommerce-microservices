const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

/**
 * @route   POST /api/products/:id/deduct-stock
 * @desc    Deduct stock after successful payment
 * @access  Internal (called by Order Service)
 */
router.post('/:id/deduct-stock', productController.deductStock.bind(productController));

/**
 * @route   POST /api/products/:id/restore-stock
 * @desc    Restore stock for cancelled/failed orders
 * @access  Internal (called by Order Service)
 */
router.post('/:id/restore-stock', productController.restoreStock.bind(productController));

/**
 * @route   GET /api/products/:id/availability
 * @desc    Check product availability and stock
 * @access  Public
 */
router.get('/:id/availability', productController.checkAvailability.bind(productController));

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById.bind(productController));

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @access  Public
 */
router.get('/', productController.getAllProducts.bind(productController));

module.exports = router;