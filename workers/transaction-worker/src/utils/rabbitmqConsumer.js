const amqp = require('amqplib');
const TransactionHistory = require('../models/TransactionHistory');
const logger = require('../config/logger');

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = process.env.RABBITMQ_QUEUE || 'transaction_queue';
    this.isConnected = false;
  }

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5673';
      
      logger.info('Connecting to RabbitMQ...', { url: rabbitmqUrl.replace(/:[^:@]+@/, ':****@') });

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Assert queue exists
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      // Set prefetch to 1 - process one message at a time
      this.channel.prefetch(1);

      this.isConnected = true;

      logger.info('RabbitMQ connected successfully', { queue: this.queueName });

      // Handle connection events
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Attempting to reconnect...');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      // Start consuming messages
      await this.startConsuming();

      return true;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: error.message });
      this.isConnected = false;
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  /**
   * Start consuming messages from the queue
   */
  async startConsuming() {
    try {
      logger.info('Starting to consume messages', { queue: this.queueName });

      await this.channel.consume(
        this.queueName,
        async (message) => {
          if (message !== null) {
            await this.processMessage(message);
          }
        },
        {
          noAck: false // Manual acknowledgment
        }
      );

      logger.info('Consumer started successfully');
    } catch (error) {
      logger.error('Error starting consumer', { error: error.message });
      throw error;
    }
  }

  /**
   * Process a single message
   */
  async processMessage(message) {
    try {
      const content = message.content.toString();
      const transactionData = JSON.parse(content);

      logger.info('Processing transaction message', {
        orderId: transactionData.orderId,
        transactionReference: transactionData.transactionReference
      });

      // Save transaction to database
      const transaction = new TransactionHistory({
        customerId: transactionData.customerId,
        orderId: transactionData.orderId,
        productId: transactionData.productId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        transactionReference: transactionData.transactionReference,
        paymentStatus: transactionData.paymentStatus,
        paymentMethod: transactionData.paymentMethod,
        timestamp: new Date(transactionData.timestamp),
        processedAt: new Date(),
        metadata: new Map(Object.entries(transactionData.metadata || {}))
      });

      await transaction.save();

      logger.info('Transaction saved to history', {
        transactionId: transaction._id,
        orderId: transactionData.orderId,
        transactionReference: transactionData.transactionReference
      });

      // Acknowledge message
      this.channel.ack(message);

      logger.info('Message acknowledged', {
        orderId: transactionData.orderId
      });

    } catch (error) {
      logger.error('Error processing message', {
        error: error.message,
        stack: error.stack
      });

      // Check if it's a duplicate key error
      if (error.code === 11000) {
        logger.warn('Duplicate transaction detected, acknowledging message', {
          error: error.message
        });
        // Acknowledge duplicate to remove from queue
        this.channel.ack(message);
      } else {
        // Reject and requeue for other errors (with limit)
        const redeliveryCount = message.fields.redelivered ? 1 : 0;
        
        if (redeliveryCount < 3) {
          logger.warn('Rejecting message for redelivery', { redeliveryCount });
          this.channel.nack(message, false, true); // Requeue
        } else {
          logger.error('Max retries exceeded, discarding message');
          this.channel.nack(message, false, false); // Don't requeue
        }
      }
    }
  }

  /**
   * Close connection gracefully
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('RabbitMQ connection closed gracefully');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: error.message });
    }
  }
}

module.exports = RabbitMQConsumer;