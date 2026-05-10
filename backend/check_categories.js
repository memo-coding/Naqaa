const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Category = mongoose.connection.db.collection('categories');
    const categories = await Category.find({}).toArray();
    console.log(JSON.stringify(categories, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
