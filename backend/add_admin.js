const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const User = require('./models/User');

const addAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const adminExists = await User.findOne({ email: 'admin2@verdant.bio' });
    if (adminExists) {
      console.log('Admin user already exists. Email: admin2@verdant.bio, Password: Admin123!');
      process.exit(0);
    }

    const newAdmin = new User({
      name: 'Test Admin',
      email: 'admin2@verdant.bio',
      password: 'Admin123!',
      role: 'admin',
    });

    await newAdmin.save();
    console.log('Admin user added successfully!');
    console.log('Email: admin2@verdant.bio');
    console.log('Password: Admin123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error);
    process.exit(1);
  }
};

addAdmin();
