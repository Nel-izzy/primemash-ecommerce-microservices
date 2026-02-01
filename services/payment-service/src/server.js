require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const rabbitmqPublisher = require('./utils/rabbitmqPublisher');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5004;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Connect to database and RabbitMQ, then start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to RabbitMQ
    await rabbitmqPublisher.connect();

    const server = app.listen(PORT, () => {
      logger.info(`Payment Service running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        pid: process.pid
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', {
        error: err.message,
        stack: err.stack
      });
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      
      // Close RabbitMQ connection
      await rabbitmqPublisher.close();
      
      // Close server
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();