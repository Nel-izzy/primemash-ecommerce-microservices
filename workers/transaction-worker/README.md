# Transaction Worker

Background worker that consumes transaction messages from RabbitMQ and saves them to transaction history database for audit trail and compliance.

## Features

-  RabbitMQ message consumption
-  Automatic message acknowledgment
-  Duplicate detection and handling
-  Retry logic with max attempts
-  Transaction history persistence
-  Automatic reconnection on failure
-  Graceful shutdown

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27022/transaction_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5673
RABBITMQ_QUEUE=transaction_queue
NODE_ENV=development
LOG_LEVEL=info
```

## Message Processing Flow

```
1. RabbitMQ → Message arrives in queue
2. Worker → Receives message
3. Worker → Parses JSON data
4. Worker → Creates TransactionHistory record
5. Worker → Saves to MongoDB
6. Worker → Acknowledges message (removed from queue)
```

## Database Schema

**TransactionHistory Model:**
- customerId (String, required, indexed)
- orderId (String, required, indexed)
- productId (String, required)
- amount (Number, required, min: 0)
- currency (String, default: NGN)
- transactionReference (String, unique, indexed)
- paymentStatus (String, indexed)
- paymentMethod (String)
- timestamp (Date, indexed) - When payment occurred
- processedAt (Date) - When worker processed it
- metadata (Map of Mixed)
- timestamps (createdAt, updatedAt)

## Error Handling

### Duplicate Messages:
- Detected via unique transactionReference
- Message acknowledged (removed from queue)
- Warning logged

### Processing Errors:
- Retry up to 3 times
- After 3 attempts, message discarded
- Error logged for investigation

### Connection Errors:
- Automatic reconnection every 5 seconds
- Worker continues processing when reconnected

## Message Format

Expected message from Payment Service:

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

## Key Features

### Reliable Processing:
- **Manual Acknowledgment**: Messages only removed after successful save
- **Prefetch Limit**: Processes one message at a time (prefetch=1)
- **Durable Queue**: Messages survive broker restart

### Idempotency:
- **Unique Constraint**: transactionReference prevents duplicates
- **Duplicate Handling**: Acknowledges without error

### Resilience:
- **Auto-Reconnection**: Reconnects on connection loss
- **Retry Logic**: Up to 3 attempts per message
- **Graceful Shutdown**: Finishes current message before stopping

## Running Locally

```bash
# Install dependencies
npm install

# Ensure MongoDB and RabbitMQ are running
docker-compose up -d transaction-db rabbitmq

# Start Transaction Worker
npm run dev

# Monitor logs
# You should see:
# [transaction-worker] info: Starting Transaction Worker...
# [transaction-worker] info: MongoDB Connected
# [transaction-worker] info: RabbitMQ connected successfully
# [transaction-worker] info: Starting to consume messages
# [transaction-worker] info: Consumer started successfully
# [transaction-worker] info: Transaction Worker started successfully
```

## Monitoring

### Success Indicators:
```
[transaction-worker] info: Processing transaction message
[transaction-worker] info: Transaction saved to history
[transaction-worker] info: Message acknowledged
```

### Duplicate Detection:
```
[transaction-worker] warn: Duplicate transaction detected, acknowledging message
```

### Processing Errors:
```
[transaction-worker] error: Error processing message
[transaction-worker] warn: Rejecting message for redelivery
```

### Connection Issues:
```
[transaction-worker] warn: RabbitMQ connection closed. Attempting to reconnect...
[transaction-worker] info: RabbitMQ connected successfully
```

## Query Transaction History

Since this is a worker (no HTTP endpoints), query via MongoDB directly:

```javascript
// Get all transactions for a customer
db.transactionhistories.find({ customerId: "507f1f77bcf86cd799439011" })

// Get all transactions for an order
db.transactionhistories.find({ orderId: "ORD-1738368000000-A1B2C3" })

// Get all completed transactions
db.transactionhistories.find({ paymentStatus: "completed" })

// Get transactions by date range
db.transactionhistories.find({
  timestamp: {
    $gte: ISODate("2026-02-01T00:00:00Z"),
    $lt: ISODate("2026-02-02T00:00:00Z")
  }
})
```

## Production Considerations

### Scaling:
- Can run multiple worker instances
- RabbitMQ distributes messages across workers
- Each worker processes messages independently

### Monitoring:
- Monitor queue depth in RabbitMQ
- Track processing time
- Alert on repeated failures

### Backup:
- Transaction history is audit trail
- Regular backups recommended
- Immutable records (no updates/deletes)

## Graceful Shutdown

Worker handles SIGTERM and SIGINT:

```bash
# Gracefully stop worker
docker-compose stop transaction-worker

# Or Ctrl+C if running locally
```

Logs show:
```
[transaction-worker] info: SIGTERM received. Shutting down gracefully...
[transaction-worker] info: RabbitMQ connection closed gracefully
```

## Key Design Decisions

1. **Worker Pattern**: Dedicated process for background processing
2. **Manual Ack**: Only acknowledge after successful save
3. **Idempotency**: Unique constraint prevents duplicate history
4. **Separation of Concerns**: Payment Service doesn't need to know about storage
5. **Audit Trail**: Immutable transaction history for compliance