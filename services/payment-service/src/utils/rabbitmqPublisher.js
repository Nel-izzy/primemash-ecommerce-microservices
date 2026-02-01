const amqp = require('amqplib');
const logger = require('../config/logger');

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = process.env.RABBITMQ_QUEUE || 'transaction_queue';
    this.isConnected = false;
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5673';
      
      logger.info('Connecting to RabbitMQ...', { url: rabbitmqUrl.replace(/:[^:@]+@/, ':****@') });

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Assert queue exists (create if it doesn't)
      await this.channel.assertQueue(this.queueName, {
        durable: true, // Queue survives broker restart
        arguments: {
          'x-queue-type': 'classic'
        }
      });

      this.isConnected = true;

      logger.info('RabbitMQ connected successfully', { queue: this.queueName });

      // Handle connection events
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.connect(), 5000);
      });

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
   * Publish transaction to queue
   */
  async publishTransaction(transactionData) {
    try {
      if (!this.isConnected || !this.channel) {
        logger.warn('RabbitMQ not connected, attempting to connect...');
        await this.connect();
      }

      const message = JSON.stringify(transactionData);
      const messageBuffer = Buffer.from(message);

      const published = this.channel.sendToQueue(
        this.queueName,
        messageBuffer,
        {
          persistent: true, // Message survives broker restart
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );

      if (published) {
        logger.info('Transaction published to queue', {
          queue: this.queueName,
          orderId: transactionData.orderId,
          transactionReference: transactionData.transactionReference
        });
        return { success: true };
      } else {
        logger.warn('Failed to publish transaction - queue full or channel closed');
        return { success: false, error: 'Queue full or channel closed' };
      }
    } catch (error) {
      logger.error('Error publishing transaction', {
        error: error.message,
        orderId: transactionData.orderId
      });
      return { success: false, error: error.message };
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

  /**
   * Check if connected
   */
  isReady() {
    return this.isConnected && this.channel !== null;
  }
}

// Export singleton instance
const publisher = new RabbitMQPublisher();
module.exports = publisher;