const Customer = require('../src/models/Customer');
const customerController = require('../src/controllers/customerController');

// Mock the Customer model
jest.mock('../src/models/Customer');

// Mock logger
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Customer Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCustomerById', () => {
    it('should return customer when found and active', async () => {
      const mockCustomer = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Nelson',
        lastName: 'Enyinnaya',
        fullName: 'Nelson Enyinnaya',
        email: 'nelson@example.com',
        phone: '+234-801-234-5678',
        address: {
          street: '15 Victoria Island Road',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          zipCode: '101241'
        },
        isActive: true,
        createdAt: new Date()
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Customer.findById.mockResolvedValue(mockCustomer);

      await customerController.getCustomerById(mockReq, mockRes, mockNext);

      expect(Customer.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          customer: expect.objectContaining({
            id: mockCustomer._id,
            firstName: 'Nelson',
            lastName: 'Enyinnaya'
          })
        }
      });
    });

    it('should return 404 when customer not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Customer.findById.mockResolvedValue(null);

      await customerController.getCustomerById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Customer not found'
      });
    });

    it('should return 403 when customer is inactive', async () => {
      const mockCustomer = {
        _id: '507f1f77bcf86cd799439011',
        isActive: false
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Customer.findById.mockResolvedValue(mockCustomer);

      await customerController.getCustomerById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Customer account is inactive'
      });
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Customer.findById.mockRejectedValue(mockError);

      await customerController.getCustomerById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getAllCustomers', () => {
    it('should return all customers', async () => {
      const mockCustomers = [
        { _id: '1', firstName: 'Nelson', isActive: true },
        { _id: '2', firstName: 'Ada', isActive: true }
      ];

      Customer.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCustomers)
      });

      await customerController.getAllCustomers(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: {
          customers: mockCustomers
        }
      });
    });

    it('should filter by isActive when provided', async () => {
      mockReq.query.isActive = 'true';

      Customer.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await customerController.getAllCustomers(mockReq, mockRes, mockNext);

      expect(Customer.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('healthCheck', () => {
    it('should return health check response with service info', async () => {
      await customerController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      // Verify response structure without asserting on database status
      // (database status depends on test environment)
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('status', 'success');
      expect(responseData).toHaveProperty('service', 'customer-service');
      expect(responseData).toHaveProperty('database');
      expect(responseData).toHaveProperty('uptime');
      expect(responseData).toHaveProperty('timestamp');
      expect(typeof responseData.uptime).toBe('number');
    });
  });
});