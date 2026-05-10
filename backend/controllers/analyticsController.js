const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard metrics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Total Revenue (sum of all delivered orders, or all paid orders)
    // For simplicity, we just sum total_amount of all orders
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((acc, order) => acc + order.total_amount, 0);
    
    // 2. Total Pending Orders (awaiting fulfillment: pending or processing)
    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

    // 3. Low Stock Items (stock < 10)
    const lowStockItems = await Product.countDocuments({ stock: { $lt: 10 } });

    // 4. Total Customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 5. Recent Customers
    const recentCustomers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name _id email');

    // 6. Real Internal Notes (Latest orders with notes)
    const internalNotes = await Order.find({ notes: { $ne: null, $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customer_name notes createdAt');

    res.json({
      revenue: totalRevenue,
      activeOrders,
      lowStockItems,
      totalCustomers,
      recentCustomers,
      internalNotes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardMetrics,
};
