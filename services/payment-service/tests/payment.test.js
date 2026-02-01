const Payment = require('../src/models/Payment');
const paymentController = require('../src/controllers/paymentController');
const rabbitmqPublisher = require('../src/utils/rabbitmqPublisher');

// Mock the Payment model
jest.mock('../src/models/Payment');

// Mock RabbitMQ publisher
jest.mock('../src/utils/rabbitmqPublisher');

// Mock logger
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Payment Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: 'ORD-1234567890-ABC123',
        productId: '507f1f77bcf86cd799439012',
        amount: 10000,
        currency: 'NGN'
      };

      const mockPayment = {
        _id: '507f1f77bcf86cd799439013',
        customerId: mockReq.body.customerId,
        orderId: mockReq.body.orderId,
        productId: mockReq.body.productId,
        amount: 10000,
        currency: 'NGN',
        paymentStatus: 'completed',
        transactionReference: 'TXN-1234567890-ABC123',
        paymentMethod: 'card',
        processingDetails: {
          initiatedAt: new Date(),
          completedAt: new Date()
        },
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.mockImplementation(() => mockPayment);

      // Mock successful payment simulation
      jest.spyOn(paymentController, 'simulatePaymentProcessing').mockResolvedValue({
        success: true
      });

      // Mock RabbitMQ publish
      rabbitmqPublisher.publishTransaction.mockResolvedValue({ success: true });

      await paymentController.processPayment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Payment processed successfully'
        })
      );
      expect(rabbitmqPublisher.publishTransaction).toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011'
        // Missing orderId and amount
      };

      await paymentController.processPayment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Missing required fields: customerId, orderId, amount'
      });
    });
  });

  describe('getPaymentById', () => {
    it('should return payment when found', async () => {
      const mockPayment = {
        _id: '507f1f77bcf86cd799439011',
        customerId: '507f1f77bcf86cd799439012',
        orderId: 'ORD-123',
        amount: 10000,
        currency: 'NGN',
        paymentStatus: 'completed',
        transactionReference: 'TXN-123'
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Payment.findById.mockResolvedValue(mockPayment);

      await paymentController.getPaymentById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          payment: expect.objectContaining({
            id: mockPayment._id,
            orderId: mockPayment.orderId
          })
        }
      });
    });

    it('should return 404 when payment not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Payment.findById.mockResolvedValue(null);

      await paymentController.getPaymentById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Payment not found'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health check response', async () => {
      rabbitmqPublisher.isReady.mockReturnValue(true);

      await paymentController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('status', 'success');
      expect(responseData).toHaveProperty('service', 'payment-service');
      expect(responseData).toHaveProperty('database');
      expect(responseData).toHaveProperty('rabbitmq');
    });
  });
});