const logger = require('../config/logger');

/**
 * Middleware to validate request body against a Joi schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', {
        path: req.path,
        errors,
        body: req.body
      });

      return res.status(400).json({
        status: 'fail',
        message: 'Validation Error',
        errors: errors.map(e => e.message)
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = {
  validateRequest
};