// Fix for ISP DNS servers that block SRV record lookups (needed for MongoDB Atlas)
try {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  console.log('DNS setServers not supported or failed in this environment');
}

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const http = require('http');
const { initSocket } = require('./utils/socket');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('Verdant Locks MERN API is running...');
});

// Paymob Redirect Bridge (works locally and in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.get('/track-order', (req, res) => {
  const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(`${FRONTEND_URL}/track-order${query}`);
});

// Route imports
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/cms', require('./routes/cmsRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
