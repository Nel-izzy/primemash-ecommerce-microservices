const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

/**
 * @route   POST /api/payments
 * @desc    Process payment
 * @access  Public
 */
router.post('/', paymentController.processPayment.bind(paymentController));

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Public
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * @route   GET /api/payments
 * @desc    Get all payments with optional filters
 * @access  Public
 */
router.get('/', paymentController.getAllPayments);

module.exports = router;