require('dotenv').config();
const connectDB = require('./config/database');
const RabbitMQConsumer = require('./utils/rabbitmqConsumer');
const logger = require('./config/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Start the worker
const startWorker = async () => {
  try {
    logger.info('Starting Transaction Worker...');

    // Connect to MongoDB
    await connectDB();

    // Create and connect RabbitMQ consumer
    const consumer = new RabbitMQConsumer();
    await consumer.connect();

    logger.info('Transaction Worker started successfully');

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', {
        error: err.message,
        stack: err.stack
      });
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      await consumer.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      await consumer.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start worker', { error: error.message });
    process.exit(1);
  }
};

startWorker();