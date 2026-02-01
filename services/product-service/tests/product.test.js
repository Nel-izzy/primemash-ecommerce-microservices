const Product = require('../src/models/Product');
const productController = require('../src/controllers/productController');

// Mock the Product model
jest.mock('../src/models/Product');

// Mock logger
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Product Controller', () => {
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

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Premium flagship smartphone',
        price: 1850000,
        currency: 'NGN',
        category: 'Electronics',
        stock: 25,
        stockStatus: 'in_stock',
        isInStock: true,
        sku: 'ELEC-SAMS24U-256',
        brand: 'Samsung',
        images: [],
        specifications: new Map(),
        isAvailable: true,
        rating: { average: 4.8, count: 342 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Product.findById.mockResolvedValue(mockProduct);

      await productController.getProductById(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          product: expect.objectContaining({
            id: mockProduct._id,
            name: 'Samsung Galaxy S24 Ultra',
            price: 1850000
          })
        }
      });
    });

    it('should return 404 when product not found', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Product.findById.mockResolvedValue(null);

      await productController.getProductById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Product not found'
      });
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      mockReq.params.id = '507f1f77bcf86cd799439011';
      Product.findById.mockRejectedValue(mockError);

      await productController.getProductById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', category: 'Electronics' },
        { _id: '2', name: 'Product 2', category: 'Fashion' }
      ];

      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        results: 2,
        data: {
          products: mockProducts
        }
      });
    });

    it('should filter by category when provided', async () => {
      mockReq.query.category = 'Electronics';

      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.find).toHaveBeenCalledWith({ category: 'Electronics' });
    });

    it('should filter by price range when provided', async () => {
      mockReq.query.minPrice = '1000';
      mockReq.query.maxPrice = '5000';

      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.find).toHaveBeenCalledWith({
        price: { $gte: 1000, $lte: 5000 }
      });
    });

    it('should filter by inStock when provided', async () => {
      mockReq.query.inStock = 'true';

      Product.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await productController.getAllProducts(mockReq, mockRes, mockNext);

      expect(Product.find).toHaveBeenCalledWith({
        stock: { $gt: 0 },
        isAvailable: true
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return availability status for requested quantity', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        isAvailable: true,
        stock: 10
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.query.quantity = '5';
      Product.findById.mockResolvedValue(mockProduct);

      await productController.checkAvailability(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          productId: mockProduct._id,
          name: mockProduct.name,
          isAvailable: true,
          availableStock: 10,
          requestedQuantity: 5,
          canFulfill: true
        }
      });
    });

    it('should return false when stock is insufficient', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        isAvailable: true,
        stock: 3
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.query.quantity = '5';
      Product.findById.mockResolvedValue(mockProduct);

      await productController.checkAvailability(mockReq, mockRes, mockNext);

      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.canFulfill).toBe(false);
    });

    it('should default to quantity 1 when not provided', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        isAvailable: true,
        stock: 10
      };

      mockReq.params.id = '507f1f77bcf86cd799439011';
      Product.findById.mockResolvedValue(mockProduct);

      await productController.checkAvailability(mockReq, mockRes, mockNext);

      const responseData = mockRes.json.mock.calls[0][0].data;
      expect(responseData.requestedQuantity).toBe(1);
    });
  });

  describe('healthCheck', () => {
    it('should return health check response with service info', async () => {
      await productController.healthCheck(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('status', 'success');
      expect(responseData).toHaveProperty('service', 'product-service');
      expect(responseData).toHaveProperty('database');
      expect(responseData).toHaveProperty('uptime');
      expect(responseData).toHaveProperty('timestamp');
      expect(typeof responseData.uptime).toBe('number');
    });
  });
});