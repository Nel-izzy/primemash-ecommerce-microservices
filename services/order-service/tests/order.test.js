const Order = require('../src/models/Order');
const orderController = require('../src/controllers/orderController');
const serviceClient = require('../src/utils/serviceClient');

// Mock the Order model
jest.mock('../src/models/Order');

// Mock service client
jest.mock('../src/utils/serviceClient');

// Mock logger
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Order Controller', () => {
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

  describe('createOrder', () => {
    it('should create order successfully with valid customer and product', async () => {
      const mockCustomer = {
        isValid: true,
        customer: {
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      const mockProduct = {
        isValid: true,
        product: {
          name: 'Test Product',
          price: 10000,
          currency: 'NGN',
          sku: 'TEST-SKU'
        }
      };

      const mockPayment = {
        success: true,
        payment: {
          id: 'payment_123'
        }
      };

      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 2
      };

      serviceClient.validateCustomer.mockResolvedValue(mockCustomer);
      serviceClient.validateProduct.mockResolvedValue(mockProduct);
      serviceClient.initiatePayment.mockResolvedValue(mockPayment);

      const mockOrder = {
        _id: '507f1f77bcf86cd799439013',
        orderId: 'ORD-1234567890-ABC123',
        customerId: mockReq.body.customerId,
        productId: mockReq.body.productId,
        quantity: 2,
        amount: 10000,
        totalAmount: 20000,
        currency: 'NGN',
        orderStatus: 'processing',
        paymentStatus: 'processing',
        paymentId: 'payment_123',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      Order.mockImplementation(() => mockOrder);

      await orderController.createOrder(mockReq, mockRes, mockNext);

      expect(serviceClient.validateCustomer).toHaveBeenCalledWith(mockReq.body.customerId);
      expect(serviceClient.validateProduct).toHaveBeenCalledWith(mockReq.body.productId, 2);
      expect(serviceClient.initiatePayment).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Order created successfully'
        })
      );
    });

    it('should return 400 when customer validation fails', async () => {
      mockReq.body = {
        customerId: 'invalid_id',
        productId: '507f1f77bcf86cd799439012',
        quantity: 1
      };

      serviceClient.validateCustomer.mockResolvedValue({
        isValid: false,
        error: 'Customer not found'
      });

      await orderController.createOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Customer not found'
      });
    });

    it('should return 400 when product validation fails', async () => {
      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011',
        productId: 'invalid_id',
        quantity: 1
      };

      serviceClient.validateCustomer.mockResolvedValue({
        isValid: true,
        customer: { email: 'test@example.com', fullName: 'Test User' }
      });

      serviceClient.validateProduct.mockResolvedValue({
        isValid: false,
        error: 'Product not found'
      });

      await orderController.createOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Product not found'
      });
    });

    it('should create order with pending status when payment fails', async () => {
      const mockCustomer = {
        isValid: true,
        customer: { email: 'test@example.com', fullName: 'Test User' }
      };

      const mockProduct = {
        isValid: true,
        product: {
          name: 'Test Product',
          price: 10000,
          currency: 'NGN',
          sku: 'TEST-SKU'
        }
      };

      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 1
      };

      serviceClient.validateCustomer.mockResolvedValue(mockCustomer);
      serviceClient.validateProduct.mockResolvedValue(mockProduct);
      serviceClient.initiatePayment.mockResolvedValue({
        success: false,
        error: 'Payment service unavailable'
      });

      const mockOrder = {
        _id: '507f1f77bcf86cd799439013',
        orderId: 'ORD-1234567890-ABC123',
        customerId: mockReq.body.customerId,
        productId: mockReq.body.productId,
        quantity: 1,
        amount: 10000,
        totalAmount: 10000,
        currency: 'NGN',
        orderStatus: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      Order.mockImplementation(() => mockOrder);

      await orderController.createOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockOrder.orderStatus).toBe('pending');
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        _id: '507f1f77bcf86cd799439011',
        orderId: 'ORD-1234567890-ABC123',
        customerId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        quantity: 1,
        amount: 10000,
        totalAmount: 10000,
        currency: 'NGN',
        orderStatus: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date()
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Order.findById.mockResolvedValue(mockOrder);

      await orderController.getOrderById(mockReq, mockRes, mockNext);

      expect(Order.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          order: expect.objectContaining({
            id: mockOrder._id,
            orderId: mockOrder.orderId
          })
        }
      });
    });

    it('should return 404 when order not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Order.findById.mockResolvedValue(null);

      await orderController.getOrderById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Order not found'
      });
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        { _id: '1', orderId: 'ORD-001', orderStatus: 'pending' },
        { _id: '2', orderId: 'ORD-002', orderStatus: 'completed' }
      ];

      Order.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOrders)
      });

      await orderController.getAllOrders(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: {
          orders: mockOrders
        }
      });
    });

    it('should filter by customerId when provided', async () => {
      mockReq.query.customerId = '507f1f77bcf86cd799439011';

      Order.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      await orderController.getAllOrders(mockReq, mockRes, mockNext);

      expect(Order.find).toHaveBeenCalledWith({ customerId: '507f1f77bcf86cd799439011' });
    });
  });

  describe('healthCheck', () => {
    it('should return health check response', async () => {
      await orderController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('status', 'success');
      expect(responseData).toHaveProperty('service', 'order-service');
      expect(responseData).toHaveProperty('database');
      expect(responseData).toHaveProperty('uptime');
      expect(responseData).toHaveProperty('timestamp');
    });
  });
});