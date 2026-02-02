const Joi = require('joi');

/**
 * Validation schema for creating an order
 */
const createOrderSchema = Joi.object({
  customerId: Joi.string()
    .required()
    .length(24)
    .hex()
    .messages({
      'string.empty': 'Customer ID is required',
      'string.length': 'Customer ID must be a valid MongoDB ObjectId (24 characters)',
      'string.hex': 'Customer ID must be a valid hexadecimal string',
      'any.required': 'Customer ID is required'
    }),
  
  productId: Joi.string()
    .required()
    .length(24)
    .hex()
    .messages({
      'string.empty': 'Product ID is required',
      'string.length': 'Product ID must be a valid MongoDB ObjectId (24 characters)',
      'string.hex': 'Product ID must be a valid hexadecimal string',
      'any.required': 'Product ID is required'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 1000'
    })
}).options({
  stripUnknown: true,  // Remove any fields not in schema
  abortEarly: false    // Return all errors, not just first one
});

module.exports = {
  createOrderSchema
};