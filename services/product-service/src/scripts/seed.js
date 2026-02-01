require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const logger = require('../config/logger');

const products = [
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium flagship smartphone with 200MP camera, 6.8" Dynamic AMOLED display, Snapdragon 8 Gen 3 processor, 12GB RAM, and 256GB storage. Perfect for photography enthusiasts and power users.',
    price: 1850000,
    currency: 'NGN',
    category: 'Electronics',
    stock: 25,
    sku: 'ELEC-SAMS24U-256',
    brand: 'Samsung',
    images: [
      'https://images.samsung.com/galaxy-s24-ultra.jpg'
    ],
    specifications: new Map([
      ['Display', '6.8" Dynamic AMOLED, 3088x1440'],
      ['Processor', 'Snapdragon 8 Gen 3'],
      ['RAM', '12GB'],
      ['Storage', '256GB'],
      ['Camera', '200MP + 12MP + 10MP + 10MP'],
      ['Battery', '5000mAh'],
      ['OS', 'Android 14']
    ]),
    isAvailable: true,
    rating: {
      average: 4.8,
      count: 342
    }
  },
  {
    name: 'Apple MacBook Air M3',
    description: 'Ultra-thin and lightweight laptop powered by Apple M3 chip. Features 13.6" Liquid Retina display, 8GB unified memory, 256GB SSD. Ideal for professionals and students.',
    price: 2100000,
    currency: 'NGN',
    category: 'Electronics',
    stock: 15,
    sku: 'ELEC-MBAM3-256',
    brand: 'Apple',
    images: [
      'https://images.apple.com/macbook-air-m3.jpg'
    ],
    specifications: new Map([
      ['Processor', 'Apple M3 chip'],
      ['Memory', '8GB unified memory'],
      ['Storage', '256GB SSD'],
      ['Display', '13.6" Liquid Retina'],
      ['Battery', 'Up to 18 hours'],
      ['Weight', '1.24kg']
    ]),
    isAvailable: true,
    rating: {
      average: 4.9,
      count: 567
    }
  },
  {
    name: 'Adidas Predator Elite FG',
    description: 'Professional football boots with Controlframe outsole and Primeknit upper. Designed for precision and power on firm ground. Available in multiple sizes.',
    price: 85000,
    currency: 'NGN',
    category: 'Sports',
    stock: 45,
    sku: 'SPRT-ADPR-ELT',
    brand: 'Adidas',
    images: [
      'https://images.adidas.com/predator-elite.jpg'
    ],
    specifications: new Map([
      ['Type', 'Firm Ground Football Boots'],
      ['Upper', 'Primeknit'],
      ['Outsole', 'Controlframe'],
      ['Closure', 'Lace-up'],
      ['Sizes', '39-45 EU']
    ]),
    isAvailable: true,
    rating: {
      average: 4.6,
      count: 128
    }
  },
  {
    name: 'Traditional Ankara Fabric (6 yards)',
    description: 'Premium quality authentic African Ankara wax print fabric. Vibrant colors and intricate patterns. Perfect for making dresses, skirts, and traditional attire. 100% cotton.',
    price: 12500,
    currency: 'NGN',
    category: 'Fashion',
    stock: 150,
    sku: 'FASH-ANK-6YD',
    brand: 'Nigerian Textile',
    images: [
      'https://images.example.com/ankara-fabric.jpg'
    ],
    specifications: new Map([
      ['Length', '6 yards'],
      ['Material', '100% Cotton'],
      ['Type', 'Ankara Wax Print'],
      ['Width', '46 inches'],
      ['Care', 'Machine washable']
    ]),
    isAvailable: true,
    rating: {
      average: 4.7,
      count: 89
    }
  },
  {
    name: 'LG 55" 4K Smart OLED TV',
    description: 'Stunning 55-inch OLED television with 4K Ultra HD resolution, webOS smart platform, and AI ThinQ. Features Dolby Vision IQ and Dolby Atmos for immersive entertainment experience.',
    price: 1450000,
    currency: 'NGN',
    category: 'Electronics',
    stock: 8,
    sku: 'ELEC-LG55-OLED',
    brand: 'LG',
    images: [
      'https://images.lg.com/oled-55-4k.jpg'
    ],
    specifications: new Map([
      ['Screen Size', '55 inches'],
      ['Resolution', '4K Ultra HD (3840x2160)'],
      ['Display Type', 'OLED'],
      ['Smart Platform', 'webOS'],
      ['HDR', 'Dolby Vision IQ, HDR10, HLG'],
      ['Audio', 'Dolby Atmos'],
      ['Connectivity', 'HDMI 2.1, USB, Wi-Fi, Bluetooth']
    ]),
    isAvailable: true,
    rating: {
      average: 4.8,
      count: 234
    }
  },
  {
    name: 'Indomie Super Pack (Carton of 40)',
    description: 'Carton of 40 packs of Indomie Instant Noodles. Nigeria\'s favorite instant noodles with delicious chicken flavor. Perfect for quick meals and stocking up.',
    price: 8500,
    currency: 'NGN',
    category: 'Food & Beverages',
    stock: 200,
    sku: 'FOOD-INDO-40PK',
    brand: 'Indomie',
    images: [
      'https://images.indomie.com/super-pack.jpg'
    ],
    specifications: new Map([
      ['Quantity', '40 packs per carton'],
      ['Flavor', 'Chicken'],
      ['Weight per pack', '70g'],
      ['Shelf Life', '12 months'],
      ['Origin', 'Nigeria']
    ]),
    isAvailable: true,
    rating: {
      average: 4.5,
      count: 456
    }
  },
  {
    name: 'Nivea Men Dark Spot Reduction Face Wash',
    description: 'Advanced face wash formulated specifically for men with dark spots. Contains Vitamin C and licorice extract. Cleanses deeply while brightening skin tone.',
    price: 3500,
    currency: 'NGN',
    category: 'Beauty',
    stock: 80,
    sku: 'BEAU-NIVM-DSPOT',
    brand: 'Nivea',
    images: [
      'https://images.nivea.com/men-face-wash.jpg'
    ],
    specifications: new Map([
      ['Volume', '100ml'],
      ['Skin Type', 'All skin types'],
      ['Key Ingredients', 'Vitamin C, Licorice Extract'],
      ['Usage', 'Daily, morning and evening'],
      ['Origin', 'Germany']
    ]),
    isAvailable: true,
    rating: {
      average: 4.4,
      count: 167
    }
  },
  {
    name: 'Sony PlayStation 5 Console',
    description: 'Next-generation gaming console with 825GB SSD, 4K gaming at 120fps, ray tracing, and 3D audio. Includes DualSense wireless controller with haptic feedback.',
    price: 950000,
    currency: 'NGN',
    category: 'Electronics',
    stock: 5,
    sku: 'ELEC-PS5-STD',
    brand: 'Sony',
    images: [
      'https://images.playstation.com/ps5-console.jpg'
    ],
    specifications: new Map([
      ['Storage', '825GB SSD'],
      ['Resolution', 'Up to 4K at 120fps'],
      ['Features', 'Ray Tracing, 3D Audio'],
      ['Controller', 'DualSense with Haptic Feedback'],
      ['Connectivity', 'Wi-Fi 6, Bluetooth 5.1'],
      ['Ports', 'HDMI 2.1, USB Type-A, USB Type-C']
    ]),
    isAvailable: true,
    rating: {
      average: 4.9,
      count: 891
    }
  },
  {
    name: 'The Psychology of Money by Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness. A bestselling book that explores the strange ways people think about money and teaches you how to make better financial decisions.',
    price: 8500,
    currency: 'NGN',
    category: 'Books',
    stock: 60,
    sku: 'BOOK-PSYM-HOU',
    brand: 'Harriman House',
    images: [
      'https://images.book.com/psychology-money.jpg'
    ],
    specifications: new Map([
      ['Author', 'Morgan Housel'],
      ['Pages', '256'],
      ['Publisher', 'Harriman House'],
      ['Language', 'English'],
      ['Format', 'Paperback'],
      ['ISBN', '9780857197689']
    ]),
    isAvailable: true,
    rating: {
      average: 4.8,
      count: 1234
    }
  },
  {
    name: 'Philips Air Fryer XXL',
    description: 'Extra-large air fryer with 7.3L capacity. Cook healthy meals with up to 90% less fat. Features Rapid Air Technology, digital touchscreen, and 7 preset programs.',
    price: 185000,
    currency: 'NGN',
    category: 'Home & Garden',
    stock: 12,
    sku: 'HOME-PHAF-XXL',
    brand: 'Philips',
    images: [
      'https://images.philips.com/air-fryer-xxl.jpg'
    ],
    specifications: new Map([
      ['Capacity', '7.3 Liters'],
      ['Power', '2225W'],
      ['Technology', 'Rapid Air Technology'],
      ['Temperature Range', '40-200°C'],
      ['Preset Programs', '7'],
      ['Dishwasher Safe', 'Yes']
    ]),
    isAvailable: true,
    rating: {
      average: 4.7,
      count: 345
    }
  }
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    logger.info('Cleared existing products');

    // Insert seed data
    const createdProducts = await Product.insertMany(products);
    logger.info(`Successfully seeded ${createdProducts.length} products`);

    // Display created products with IDs
    console.log('\n========== SEEDED PRODUCTS ==========\n');
    createdProducts.forEach((product) => {
      console.log(`ID: ${product._id}`);
      console.log(`Name: ${product.name}`);
      console.log(`SKU: ${product.sku}`);
      console.log(`Price: ${product.currency} ${product.price.toLocaleString()}`);
      console.log(`Category: ${product.category}`);
      console.log(`Stock: ${product.stock} (${product.stockStatus})`);
      console.log(`Rating: ${product.rating.average}/5 (${product.rating.count} reviews)`);
      console.log('---');
    });
    console.log('\n======================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding products', { error: error.message });
    process.exit(1);
  }
};

seedProducts();