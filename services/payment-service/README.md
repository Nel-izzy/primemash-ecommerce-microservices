# Payment Service

Processes payments and publishes transaction details to RabbitMQ for audit trail and transaction history.

## Features

-  Simulated payment processing (demo gateway)
-  Auto-generated transaction references
-  Payment status tracking (pending, processing, completed, failed)
-  RabbitMQ message publishing
-  Retry logic and error handling
-  95% success rate simulation
-  Comprehensive logging

## API Endpoints

### Process Payment
```http
POST /api/payments
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "orderId": "ORD-1738368000000-A1B2C3",
  "productId": "507f1f77bcf86cd799439012",
  "amount": 1850000,
  "currency": "NGN"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment processed successfully",
  "data": {
    "payment": {
      "id": "697f0527c2cd61f8bc5c3b15",
      "customerId": "507f1f77bcf86cd799439011",
      "orderId": "ORD-1738368000000-A1B2C3",
      "amount": 1850000,
      "currency": "NGN",
      "paymentStatus": "completed",
      "transactionReference": "TXN-1738368127000-A1B2C3D4",
      "paymentMethod": "card",
      "createdAt": "2026-02-01T..."
    }
  }
}
```

### Get Payment by ID
```http
GET /api/payments/:id
```

### Get All Payments
```http
GET /api/payments?customerId=...&paymentStatus=completed&orderId=...
```

**Query Parameters:**
- `customerId`: Filter by customer
- `paymentStatus`: Filter by status (pending, processing, completed, failed)
- `orderId`: Filter by order

### Health Check
```http
GET /health
```

**Response includes RabbitMQ connection status:**
```json
{
  "status": "success",
  "service": "payment-service",
  "uptime": 45.123,
  "timestamp": "2026-02-01T...",
  "database": "connected",
  "rabbitmq": "connected"
}
```

## Environment Variables

```env
PORT=5004
MONGODB_URI=mongodb://localhost:27021/payment_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5673
RABBITMQ_QUEUE=transaction_queue
NODE_ENV=development
LOG_LEVEL=info
```

## Payment Processing Flow

```
1. Order Service → POST /api/payments
2. Payment Service → Create payment record (status: processing)
3. Payment Service → Simulate payment processing (500ms-1.5s delay)
4. Payment Service → Update payment status (completed/failed)
5. Payment Service → Publish to RabbitMQ
6. RabbitMQ → Queue message for transaction worker
7. Payment Service → Return response to Order Service
```

## RabbitMQ Message Format

```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "orderId": "ORD-1738368000000-A1B2C3",
  "productId": "507f1f77bcf86cd799439012",
  "amount": 1850000,
  "currency": "NGN",
  "transactionReference": "TXN-1738368127000-A1B2C3D4",
  "paymentStatus": "completed",
  "paymentMethod": "card",
  "timestamp": "2026-02-01T12:34:56.789Z"
}
```

## Database Schema

**Payment Model:**
- customerId (ObjectId, required, indexed)
- orderId (String, required, indexed)
- productId (ObjectId, required)
- amount (Number, required, min: 0)
- currency (String, enum, default: NGN)
- paymentStatus (String, enum: pending/processing/completed/failed)
- paymentMethod (String, enum: card/bank_transfer/wallet/cash, default: card)
- transactionReference (String, unique, auto-generated: TXN-TIMESTAMP-RANDOM)
- paymentGateway (String, default: demo_gateway)
- processingDetails (Object):
  - initiatedAt (Date)
  - completedAt (Date)
  - attemptCount (Number)
  - lastError (String)
- metadata (Map of String)
- timestamps (createdAt, updatedAt)

**Virtuals:**
- processingDuration: completedAt - initiatedAt (milliseconds)

## Simulated Payment Processing

**For demonstration purposes only:**
- 95% success rate
- 500ms - 1.5s processing time
- Random failures simulate "insufficient funds" or "card declined"
- In production, this would integrate with real payment gateways (Paystack, Flutterwave, Stripe, etc.)

## RabbitMQ Integration

### Publisher Features:
-  Automatic reconnection on failure
-  Durable queue (survives broker restart)
-  Persistent messages (survive broker restart)
-  Connection health monitoring
-  Graceful shutdown

### Message Guarantees:
- Messages published only for **completed** payments
- Duplicate prevention via unique transactionReference
- Automatic retry on publish failure

## Error Handling

### Payment Failures:
- Recorded in database with error details
- Not published to RabbitMQ (only successful payments)
- Graceful response to Order Service

### RabbitMQ Failures:
- Payment still marked as successful
- Warning logged for monitoring
- Automatic reconnection attempted

## Key Design Decisions

1. **Payment First, Publish Second**: Payment saved before RabbitMQ publish
2. **Idempotency**: Transaction references prevent duplicates
3. **Graceful Degradation**: Payment succeeds even if RabbitMQ is down
4. **Audit Trail**: All payment attempts recorded (success and failure)
5. **Simulation**: 95% success rate mimics real-world payment gateways

## Running Locally

```bash
# Install dependencies
npm install

# Ensure RabbitMQ is running
docker-compose up -d rabbitmq

# Start Payment Service
npm run dev

# Process a test payment
curl -X POST http://localhost:5004/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "507f1f77bcf86cd799439011",
    "orderId": "ORD-TEST-123",
    "productId": "507f1f77bcf86cd799439012",
    "amount": 10000,
    "currency": "NGN"
  }'
```

## Testing

```bash
npm test
```

Expected: 4 test suites passing