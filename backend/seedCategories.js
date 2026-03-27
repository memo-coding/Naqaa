// Fix for ISP DNS servers that block SRV record lookups (needed for MongoDB Atlas)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Category = require('./models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const categories = [
  { name: 'Exotics', name_ar: 'الغريبة', category_id: 1, slug: 'exotics', order: 1 },
  { name: 'Succulents', name_ar: 'العصاريات', category_id: 2, slug: 'succulents', order: 2 },
  { name: 'Climbers', name_ar: 'المتسلقات', category_id: 3, slug: 'climbers', order: 3 },
  { name: 'Ground Cover', name_ar: 'الغطاء الأرضي', category_id: 4, slug: 'ground_cover', order: 4 },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    // Check if categories already exist
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('Seeding initial categories...');
      await Category.insertMany(categories);
      console.log('Categories seeded successfully!');
    } else {
      console.log('Categories already exist, skipping seed.');
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}

seed();
