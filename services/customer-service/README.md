# Customer Service

Manages customer data and provides customer information to other services.

## Features

-  Customer retrieval by ID
-  Active/inactive customer status
-  Input validation and sanitization
-  Comprehensive error handling
-  Health check endpoint
-  Seeded test data

## API Endpoints

### Get Customer by ID
```http
GET /api/customers/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "customer": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Nelson",
      "lastName": "Enyinnaya",
      "fullName": "Nelson Enyinnaya",
      "email": "nelson.enyinnaya@example.com",
      "phone": "+234-801-234-5678",
      "address": {
        "street": "15 Victoria Island Road",
        "city": "Lagos",
        "state": "Lagos",
        "country": "Nigeria",
        "zipCode": "101241"
      },
      "isActive": true,
      "createdAt": "2026-01-31T10:00:00.000Z"
    }
  }
}
```

### Get All Customers
```http
GET /api/customers?isActive=true
```

### Health Check
```http
GET /health
```

## Environment Variables

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27018/customer_db
NODE_ENV=development
LOG_LEVEL=info
```

## Running Locally

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start development server
npm run dev

# Run tests
npm test
```

## Database Schema

**Customer Model:**
- firstName (String, required)
- lastName (String, required)
- email (String, required, unique)
- phone (String, required)
- address (Object):
  - street (String, required)
  - city (String, required)
  - state (String, required)
  - country (String, required)
  - zipCode (String, required)
- isActive (Boolean, default: true)
- timestamps (createdAt, updatedAt)

## Seeded Customers

The service comes pre-seeded with 5 Nigerian customers for testing purposes.