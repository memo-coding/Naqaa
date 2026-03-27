const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const MOCK_TAG = "MOCK_PAGINATION_TEST";

const run = async () => {
  try {
    await connectDB();
    console.log('Seeding temporary mock data for pagination testing...');

    // Need a real user ID to attribute orders? Let's use an existing customer or create a mock customer.
    const mockUsers = [];
    for (let i = 1; i <= 35; i++) {
       mockUsers.push({
         name: `عميل تجريبي ${i} (Pagination)`,
         email: `mock_user_${i}@pagination.test_${new Date().getTime()}`,
         password: 'Customer123!',
         role: 'customer',
         _mockTag: MOCK_TAG
       });
    }
    const insertedUsers = await User.insertMany(mockUsers);
    console.log(`Inserted ${insertedUsers.length} mock users.`);

    const mockProducts = [];
    for (let i = 1; i <= 35; i++) {
        mockProducts.push({
           name: `Mock Product ${i} for Pagination`,
           name_ar: `منتج تجريبي ${i} للترقيم`,
           price: Math.floor(Math.random() * 80) + 10,
           stock: Math.floor(Math.random() * 200),
           category_id: (i % 3) + 1,
           img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
           is_active: i % 4 !== 0,
           _mockTag: MOCK_TAG
        });
    }
    const insertedProducts = await Product.insertMany(mockProducts);
    console.log(`Inserted ${insertedProducts.length} mock products.`);

    const mockOrders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const pMethods = ['card', 'wallet', 'manual'];

    for (let i = 1; i <= 40; i++) {
        const randUser = insertedUsers[i % insertedUsers.length];
        const randProduct = insertedProducts[i % insertedProducts.length];
        
        mockOrders.push({
            user: randUser._id,
            total_amount: randProduct.price * 2 + 15,
            items: [
                {
                   product_id: randProduct._id,
                   name: randProduct.name,
                   quantity: 2,
                   price: randProduct.price,
                   img: randProduct.img
                }
            ],
            shipping_address: '123 شارع الترقيم الوهمي',
            shipping_city: ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة'][i % 4],
            shipping_country: 'Egypt',
            status: statuses[i % statuses.length],
            payment_status: ['pending', 'paid', 'unpaid'][i % 3],
            payment_method: pMethods[i % 3],
            customer_name: randUser.name,
            customer_email: randUser.email,
            customer_phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
            _mockTag: MOCK_TAG
        });
    }
    const insertedOrders = await Order.insertMany(mockOrders);
    console.log(`Inserted ${insertedOrders.length} mock orders.`);

    console.log('Mock Data Seeding Complete!');
    process.exit(0);

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

run();
