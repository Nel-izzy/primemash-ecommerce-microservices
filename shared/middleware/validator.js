const { AppError } = require('./errorHandler');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }

    req.validatedBody = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return next(new AppError(errors.join(', '), 400));
    }

    req.validatedParams = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateParams
};