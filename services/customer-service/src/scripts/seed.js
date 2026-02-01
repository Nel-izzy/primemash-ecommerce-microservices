require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const logger = require('../config/logger');

const customers = [
  {
    firstName: 'Nelson',
    lastName: 'Enyinnaya',
    email: 'nelson.enyinnaya@example.com',
    phone: '+234-801-234-5678',
    address: {
      street: '15 Victoria Island Road',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '101241'
    },
    isActive: true
  },
  {
    firstName: 'Ada',
    lastName: 'Okonkwo',
    email: 'ada.okonkwo@example.com',
    phone: '+234-802-345-6789',
    address: {
      street: '25 Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      zipCode: '101245'
    },
    isActive: true
  },
  {
    firstName: 'Chukwudi',
    lastName: 'Nwosu',
    email: 'chukwudi.nwosu@example.com',
    phone: '+234-803-456-7890',
    address: {
      street: '8 Independence Layout',
      city: 'Enugu',
      state: 'Enugu',
      country: 'Nigeria',
      zipCode: '400001'
    },
    isActive: true
  },
  {
    firstName: 'Fatima',
    lastName: 'Mohammed',
    email: 'fatima.mohammed@example.com',
    phone: '+234-804-567-8901',
    address: {
      street: '12 Ahmadu Bello Way',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      zipCode: '900001'
    },
    isActive: true
  },
  {
    firstName: 'Oluwaseun',
    lastName: 'Adeyemi',
    email: 'oluwaseun.adeyemi@example.com',
    phone: '+234-805-678-9012',
    address: {
      street: '45 Ring Road',
      city: 'Ibadan',
      state: 'Oyo',
      country: 'Nigeria',
      zipCode: '200001'
    },
    isActive: true
  }
];

const seedCustomers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('Connected to MongoDB');

    // Clear existing customers
    await Customer.deleteMany({});
    logger.info('Cleared existing customers');

    // Insert seed data
    const createdCustomers = await Customer.insertMany(customers);
    logger.info(`Successfully seeded ${createdCustomers.length} customers`);

    // Display created customers with IDs
    console.log('\n========== SEEDED CUSTOMERS ==========\n');
    createdCustomers.forEach((customer) => {
      console.log(`ID: ${customer._id}`);
      console.log(`Name: ${customer.fullName}`);
      console.log(`Email: ${customer.email}`);
      console.log(`Phone: ${customer.phone}`);
      console.log(`Location: ${customer.address.city}, ${customer.address.state}`);
      console.log('---');
    });
    console.log('\n======================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding customers', { error: error.message });
    process.exit(1);
  }
};

seedCustomers();