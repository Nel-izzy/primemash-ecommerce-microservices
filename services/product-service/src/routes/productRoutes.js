const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

/**
 * @route   GET /api/products/:id/availability
 * @desc    Check product availability and stock
 * @access  Public
 */
router.get('/:id/availability', productController.checkAvailability);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @access  Public
 */
router.get('/', productController.getAllProducts);

module.exports = router;