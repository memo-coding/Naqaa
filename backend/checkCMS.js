// Fix for ISP DNS servers that block SRV record lookups (needed for MongoDB Atlas)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const CMS = require('./models/CMS');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkCMS() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const config = await CMS.findOne({ key: 'global_config' });
    if (config) {
      console.log('CMS Config found:', JSON.stringify(config.data, null, 2));
    } else {
      console.log('CMS Config not found. Creating default...');
      // I won't create it here to avoid accidental overrides, but it explains the 200 null response.
    }
  } catch (err) {
    console.error('Check CMS error:', err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
}
checkCMS();
