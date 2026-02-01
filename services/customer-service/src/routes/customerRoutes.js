const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID
 * @access  Public (in real-world, this would be protected)
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 * @access  Public (in real-world, this would be admin only)
 */
router.get('/', customerController.getAllCustomers);

module.exports = router;