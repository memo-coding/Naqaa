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

const run = async () => {
  try {
    await connectDB();
    console.log('🗑️  Searching for mock pagination data by pattern...');

    // Orders with mock shipping address
    const deletedOrders = await Order.deleteMany({
      shipping_address: { $regex: 'الترقيم الوهمي', $options: 'i' }
    });
    console.log(`✅ Deleted ${deletedOrders.deletedCount} mock orders.`);

    // Products with "Pagination" or "للترقيم" in name
    const deletedProducts = await Product.deleteMany({
      $or: [
        { name: { $regex: 'Pagination', $options: 'i' } },
        { name_ar: { $regex: 'للترقيم', $options: 'i' } }
      ]
    });
    console.log(`✅ Deleted ${deletedProducts.deletedCount} mock products.`);

    // Users with mock email pattern
    const deletedUsers = await User.deleteMany({
      email: { $regex: 'pagination\\.test', $options: 'i' }
    });
    console.log(`✅ Deleted ${deletedUsers.deletedCount} mock users.`);

    console.log('🎉 Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

run();
