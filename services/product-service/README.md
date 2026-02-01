# Product Service

Manages product catalog and provides product information to other services.

## Features

-  Product retrieval by ID
-  Product listing with filters (category, price range, availability)
-  Stock availability checking
-  Comprehensive product data (specs, images, ratings)
-  Input validation and sanitization
-  Health check endpoint
-  Seeded test data (10 Nigerian e-commerce products)

## API Endpoints

### Get Product by ID
```http
GET /api/products/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Samsung Galaxy S24 Ultra",
      "description": "Premium flagship smartphone...",
      "price": 1850000,
      "currency": "NGN",
      "category": "Electronics",
      "stock": 25,
      "stockStatus": "in_stock",
      "isInStock": true,
      "sku": "ELEC-SAMS24U-256",
      "brand": "Samsung",
      "images": [...],
      "specifications": {...},
      "isAvailable": true,
      "rating": {
        "average": 4.8,
        "count": 342
      }
    }
  }
}
```

### Get All Products
```http
GET /api/products?category=Electronics&minPrice=100000&maxPrice=2000000&inStock=true
```

**Query Parameters:**
- `category`: Filter by category
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `isAvailable`: Filter by availability (true/false)
- `inStock`: Show only in-stock products (true/false)

### Check Product Availability
```http
GET /api/products/:id/availability?quantity=5
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "productId": "507f1f77bcf86cd799439011",
    "name": "Samsung Galaxy S24 Ultra",
    "isAvailable": true,
    "availableStock": 25,
    "requestedQuantity": 5,
    "canFulfill": true
  }
}
```

### Health Check
```http
GET /health
```

## Environment Variables

```env
PORT=5002
MONGODB_URI=mongodb://localhost:27019/product_db
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

**Product Model:**
- name (String, required, 3-100 chars)
- description (String, required, 10-1000 chars)
- price (Number, required, >= 0)
- currency (String, enum: NGN/USD/EUR/GBP, default: NGN)
- category (String, required, enum: Electronics/Fashion/Home & Garden/etc.)
- stock (Number, required, integer, >= 0)
- sku (String, required, unique, uppercase)
- brand (String, optional)
- images (Array of Strings, max 5)
- specifications (Map of String)
- isAvailable (Boolean, default: true)
- rating (Object):
  - average (Number, 0-5)
  - count (Number, >= 0)
- timestamps (createdAt, updatedAt)

**Virtuals:**
- stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock'
- isInStock: boolean (isAvailable && stock > 0)

## Seeded Products

The service comes pre-seeded with 10 diverse Nigerian e-commerce products:
1. Samsung Galaxy S24 Ultra
2. Apple MacBook Air M3
3. Adidas Predator Elite FG
4. Traditional Ankara Fabric
5. LG 55" 4K Smart OLED TV
6. Indomie Super Pack
7. Nivea Men Dark Spot Reduction Face Wash
8. Sony PlayStation 5 Console
9. The Psychology of Money (Book)
10. Philips Air Fryer XXL

## Business Logic

- Products automatically become unavailable when stock reaches 0
- Stock status is calculated based on current stock level
- Availability check validates requested quantity against available stock
- Text search enabled on name and description fields
- Optimized indexes for common query patterns