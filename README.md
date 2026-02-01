# Primemash Ecommerce Microservices

A production-grade microservices-based e-commerce system demonstrating seamless inter-service communication using REST APIs and RabbitMQ message queues.

##  Architecture

### Services
- **Customer Service** (Port 5001): Manages customer data
- **Product Service** (Port 5002): Manages product catalog
- **Order Service** (Port 5003): Orchestrates order creation and payment flow
- **Payment Service** (Port 5004): Processes payments and publishes transactions
- **Transaction Worker**: Consumes RabbitMQ messages and saves transaction history

### Communication Patterns
- **Synchronous**: REST APIs for client-to-service and service-to-service communication
- **Asynchronous**: RabbitMQ for transaction history and audit trail

### Technology Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (separate instance per service)
- **Message Broker**: RabbitMQ
- **Containerization**: Docker & Docker Compose

##  Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd primemash-ecommerce-microservices
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Verify services are running**
   - Customer Service: http://localhost:5001/health
   - Product Service: http://localhost:5002/health
   - Order Service: http://localhost:5003/health
   - Payment Service: http://localhost:5004/health
   - RabbitMQ Management UI: http://localhost:15673 (admin/admin123)

### Custom Ports (Avoid Conflicts)
This project uses custom ports to avoid conflicts with existing services:
- **MongoDB**: 27018-27022 (instead of default 27017)
- **RabbitMQ AMQP**: 5673 (instead of default 5672)
- **RabbitMQ Management**: 15673 (instead of default 15672)

##  API Endpoints

### Customer Service (Port 5001)
- `GET /api/customers/:id` - Get customer by ID
- `GET /health` - Health check

### Product Service (Port 5002)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products` - Get all products
- `GET /health` - Health check

### Order Service (Port 5003)
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /health` - Health check

### Payment Service (Port 5004)
- `POST /api/payments` - Process payment
- `GET /health` - Health check

##  Order Flow

1. **Client creates order** → POST to Order Service
2. **Order Service validates**:
   - Checks if customer exists (calls Customer Service)
   - Checks if product exists (calls Product Service)
3. **Order Service saves order** with status "pending"
4. **Order Service initiates payment** → POST to Payment Service
5. **Payment Service processes payment**:
   - Saves payment record
   - Publishes transaction to RabbitMQ
   - Returns success to Order Service
6. **Transaction Worker** consumes message and saves to transaction history
7. **Order Service updates order status** and returns response to client

##  Testing

Run tests for all services:
```bash
npm test
```

Run tests for a specific service:
```bash
cd services/customer-service
npm test
```

##  Project Structure

```
primemash-ecommerce-microservices/
├── services/
│   ├── customer-service/
│   ├── product-service/
│   ├── order-service/
│   └── payment-service/
├── workers/
│   └── transaction-worker/
├── shared/
│   ├── utils/
│   └── middleware/
├── docker-compose.yml
└── README.md
```

##  Security Best Practices

- Environment variables for sensitive configuration
- Input validation using Joi
- Error handling middleware
- Request logging
- MongoDB injection prevention
- CORS configuration

##  Development

### Running Services Locally (Without Docker)

1. Start MongoDB instances on custom ports
2. Start RabbitMQ on custom port
3. Create `.env` files for each service
4. Run each service:
   ```bash
   cd services/customer-service
   npm run dev
   ```

##  Troubleshooting

### Port conflicts
If you encounter port conflicts, check if services are already running on ports 5001-5004, 27018-27022, or 5673/15673.

### MongoDB connection issues
Ensure MongoDB containers are healthy:
```bash
docker-compose ps
```

### RabbitMQ connection issues
Check RabbitMQ logs:
```bash
docker-compose logs rabbitmq
```

## 👨 Author

**Nelson Enyinnaya Nelson**  


## 📄 License

ISC