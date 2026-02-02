const express = require('express');
const orderController = require('../controllers/orderController');
const { validateRequest } = require('../middleware/validation');
const { createOrderSchema } = require('../validators/orderValidator');

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create new order (with input validation)
 * @access  Public
 */
router.post('/', validateRequest(createOrderSchema), orderController.createOrder);

/**
 * @route   GET /api/orders/order/:orderId
 * @desc    Get order by orderId (e.g., ORD-1234567890-ABC123)
 * @access  Public
 */
router.get('/order/:orderId', orderController.getOrderByOrderId);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by MongoDB _id
 * @access  Public
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with optional filters
 * @access  Public
 */
router.get('/', orderController.getAllOrders);

module.exports = router;