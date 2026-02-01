# Order Service

Orchestrates the order creation flow by coordinating between Customer, Product, and Payment services.

## Features

- ✅ Customer validation via Customer Service
- ✅ Product validation and stock checking via Product Service
- ✅ Order creation with auto-generated orderId
- ✅ Payment initiation via Payment Service
- ✅ Order status tracking (pending, processing, completed, failed)
- ✅ Payment status tracking (pending, processing, paid, failed)
- ✅ Denormalized customer and product data for quick access
- ✅ Comprehensive error handling
- ✅ Service-to-service communication with retry logic

## API Endpoints

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "order": {
      "customerId": "507f1f77bcf86cd799439011",
      "orderId": "ORD-1738368000000-A1B2C3",
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "amount": 1850000,
      "totalAmount": 3700000,
      "currency": "NGN",
      "orderStatus": "processing",
      "paymentStatus": "processing",
      "createdAt": "2026-02-01T..."
    }
  }
}
```

### Get Order by ID
```http
GET /api/orders/:id
```

### Get Order by Order Reference
```http
GET /api/orders/order/:orderId
```
Example: `GET /api/orders/order/ORD-1738368000000-A1B2C3`

### Get All Orders
```http
GET /api/orders?customerId=507f1f77bcf86cd799439011&orderStatus=pending
```

**Query Parameters:**
- `customerId`: Filter by customer
- `orderStatus`: Filter by status (pending, processing, completed, failed, cancelled)
- `limit`: Maximum number of results (default: 50)

### Health Check
```http
GET /health
```

## Environment Variables

```env
PORT=5003
MONGODB_URI=mongodb://localhost:27020/order_db
CUSTOMER_SERVICE_URL=http://localhost:5001
PRODUCT_SERVICE_URL=http://localhost:5002
PAYMENT_SERVICE_URL=http://localhost:5004
NODE_ENV=development
LOG_LEVEL=info
```

## Order Creation Flow

```
1. Client → POST /api/orders
2. Order Service → Validate Customer (GET Customer Service)
3. Order Service → Validate Product & Stock (GET Product Service)
4. Order Service → Calculate Amount
5. Order Service → Create Order (status: pending)
6. Order Service → Initiate Payment (POST Payment Service)
7. Payment Service → Process Payment
8. Payment Service → Publish to RabbitMQ
9. Order Service → Update Order Status (processing)
10. Order Service → Return Response to Client
```

## Database Schema

**Order Model:**
- customerId (ObjectId, required, indexed)
- productId (ObjectId, required, indexed)
- orderId (String, unique, auto-generated: ORD-TIMESTAMP-RANDOM)
- quantity (Number, required, min: 1, default: 1)
- amount (Number, required, min: 0) - Unit price
- currency (String, enum, default: NGN)
- orderStatus (String, enum: pending/processing/completed/failed/cancelled)
- paymentStatus (String, enum: pending/processing/paid/failed)
- paymentId (ObjectId, nullable)
- customerInfo (Object): email, name - Denormalized for performance
- productInfo (Object): name, sku, price - Denormalized for performance
- notes (String, max: 500)
- metadata (Map of String)
- timestamps (createdAt, updatedAt)

**Virtuals:**
- totalAmount: amount × quantity
- statusDisplay: { order, payment }

## Service Communication

### Customer Service Integration
```javascript
GET /api/customers/:customerId
- Validates customer exists and is active
- Returns customer details for order record
```

### Product Service Integration
```javascript
GET /api/products/:productId
- Validates product exists

GET /api/products/:productId/availability?quantity=X
- Checks sufficient stock for order
- Returns availability status
```

### Payment Service Integration
```javascript
POST /api/payments
{
  "customerId": "...",
  "orderId": "...",
  "amount": 10000,
  "currency": "NGN",
  "productId": "..."
}
- Initiates payment processing
- Returns payment ID for order tracking
```

## Error Handling

### Validation Errors (400)
- Customer not found
- Customer account inactive
- Product not found
- Insufficient stock
- Invalid quantity

### Service Errors (500/503)
- Customer service unavailable
- Product service unavailable
- Payment service unavailable
- Database connection errors

### Graceful Degradation
- If payment initiation fails, order is still created with "pending" status
- Customer can retry payment later using orderId

## Testing

```bash
# Run unit tests
npm test

# Expected: 8 test suites passing
```

## Key Design Decisions

1. **Denormalized Data**: Store customer/product info in order for fast retrieval
2. **Auto-Generated OrderId**: Human-readable reference (ORD-TIMESTAMP-RANDOM)
3. **Separate Status Fields**: orderStatus vs paymentStatus for granular tracking
4. **Graceful Failure**: Order created even if payment fails
5. **Service Timeouts**: 5-10s timeouts prevent hanging requests
6. **Comprehensive Logging**: Track full order lifecycle for debugging

## Running Locally

```bash
# Install dependencies
npm install

# Start dependencies first
# Customer Service on 5001
# Product Service on 5002
# Payment Service on 5004

# Start Order Service
npm run dev

# Test order creation
curl -X POST http://localhost:5003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_FROM_SEED",
    "productId": "PRODUCT_ID_FROM_SEED",
    "quantity": 1
  }'
```