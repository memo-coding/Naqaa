const Order = require('../models/Order');
const Notification = require('../models/Notification');
const ShippingCompany = require('../models/ShippingCompany');
const CMS = require('../models/CMS');
const User = require('../models/User');
const { getIO } = require('../utils/socket');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (or Public if guest checkout is allowed)
const createOrder = async (req, res) => {
  const {
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_city,
    shipping_country,
    notes,
    payment_method,
    payment_status,
    items
  } = req.body;

  try {
    const order = new Order({
      user_id: req.user ? req.user._id : (req.body.user_id || null),
      total_amount,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_country,
      notes,
      payment_method: payment_method || 'card',
      payment_status: payment_method === 'manual' ? 'unpaid' : payment_method === 'card' || payment_method === 'wallet' ? 'pending' : 'pending',
      items
    });

    const createdOrder = await order.save();
    
    // Notify Admins
    const notification = await Notification.create({
      forAdmin: true,
      title: 'New Order Received',
      message: `Order received from ${customer_name}`,
      type: 'order',
      link: '/admin/orders',
      metadata: { orderId: createdOrder._id, amount: total_amount, customer: customer_name }
    });

    // Emit socket event to admins
    try {
      getIO().to('admin_room').emit('newOrder', {
        ...createdOrder.toObject(),
        notification
      });
      getIO().to('admin_room').emit('notification', notification);
    } catch (err) {
      console.error('Socket emit failed:', err.message);
    }

    // Notify Customer if logged in
    if (req.user) {
      const userNotification = await Notification.create({
        user: req.user._id,
        title: 'Order Confirmed',
        message: 'Your order has been successfully placed and is being processed.',
        type: 'order',
        link: '/profile',
        metadata: { orderId: createdOrder._id }
      });

      // Emit socket event to customer
      try {
        getIO().to(req.user._id.toString()).emit('notification', userNotification);
      } catch (err) {
        console.error('Socket emit failed:', err.message);
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    
    // Map _id to id
    const formattedOrders = orders.map(o => {
      const oObj = o.toObject();
      return { ...oObj, id: oObj._id, created_at: oObj.createdAt };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    // Map _id to id
    const formattedOrders = orders.map(o => {
      const oObj = o.toObject();
      return { ...oObj, id: oObj._id, created_at: oObj.createdAt };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status, shipping_company_id } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const previousStatus = order.status;
      order.status = status;

      // Handle status specific updates
      if (status === 'delivered' && order.payment_status !== 'paid') {
        order.payment_status = 'paid';
      }

      // Handle reverting from shipped status
      if (previousStatus === 'shipped' && status !== 'shipped' && order.shipping_company_id) {
        const company = await ShippingCompany.findById(order.shipping_company_id);
        if (company) {
          if (order.payment_status === 'pending' || order.payment_status === 'unpaid' || order.payment_method === 'manual') {
              company.cod_pending = Math.max(0, company.cod_pending - order.total_amount);
          } else {
              company.fees_owed = Math.max(0, company.fees_owed - (company.fees_per_order || 0));
          }
          company.total_orders = Math.max(0, company.total_orders - 1);
          await company.save();
        }
        // Remove shipping assignment
        order.shipping_company_id = null;
        order.shipping_company_name = null;
      }

      // Handle shipping company assignment when marking as shipped
      if (status === 'shipped' && shipping_company_id) {
        const company = await ShippingCompany.findById(shipping_company_id);
        if (company) {
          order.shipping_company_id = company._id;
          order.shipping_company_name = company.name;
          // Only update financials if this is a new shipment
          if (previousStatus !== 'shipped') {
            // COD (manual/unpaid): company collects full amount from customer, 
            // must return full amount to store (company keeps their fee from the collected cash)
            if (order.payment_status === 'pending' || order.payment_status === 'unpaid' || order.payment_method === 'manual') {
                company.cod_pending += order.total_amount;
            } else {
                // Electronic (card/wallet): store already collected money,  
                // store owes the shipping company their fees only
                company.fees_owed += (company.fees_per_order || 0);
            }
            company.total_orders += 1;
            await company.save();
          }
        }
      }

      const updatedOrder = await order.save();
      
      // Update User Loyalty if delivered
      if (status === 'delivered' && updatedOrder.user_id) {
        try {
          const user = await User.findById(updatedOrder.user_id);
          const cmsConfig = await CMS.findOne({ key: 'global_config' });
          
          if (user && cmsConfig) {
            const thresholds = cmsConfig.data || {};
            const plat = thresholds.tierPlatinumThreshold || 1000;
            const gold = thresholds.tierGoldThreshold || 500;
            
            user.totalSpent = (user.totalSpent || 0) + updatedOrder.total_amount;
            
            if (user.totalSpent >= plat) {
              user.loyaltyTier = 'Platinum';
            } else if (user.totalSpent >= gold) {
              user.loyaltyTier = 'Gold';
            } else {
              user.loyaltyTier = 'Member';
            }
            
            await user.save();
            console.log(`User ${user.email} updated to tier ${user.loyaltyTier}`);
          }
        } catch (err) {
          console.error('Loyalty update failed:', err.message);
        }
      }
      
      // Notify Customer if applicable
      if (updatedOrder.user_id) {
        let statusMessage = `Your order status has been updated to: ${status}`;
        if (status === 'shipped') statusMessage = 'Your order is on the way!';
        if (status === 'delivered') statusMessage = 'Your order has been delivered. Enjoy your Verdant Locks products!';
        if (status === 'cancelled') statusMessage = 'Your order has been cancelled.';
        if (status === 'cancelled_no_refund') statusMessage = 'Your order has been cancelled. Please note this cancellation does not include a refund.';
        
        const notification = await Notification.create({
          user: updatedOrder.user_id,
          title: 'Order Status Update',
          message: statusMessage,
          type: 'order',
          link: '/profile',
          metadata: { orderId: updatedOrder._id, status: status }
        });

        // Emit socket event to customer
        try {
          getIO().to(updatedOrder.user_id.toString()).emit('orderUpdate', {
            orderId: updatedOrder._id,
            status: status,
            notification
          });
          // Also emit as a general notification
          getIO().to(updatedOrder.user_id.toString()).emit('notification', notification);
        } catch (err) {
          console.error('Socket emit failed:', err.message);
        }
      }

      const resOrder = updatedOrder.toObject();
      resOrder.id = resOrder._id;
      
      res.json(resOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Confirm delivery of an order (User)
// @route   PUT /api/orders/:id/confirm
// @access  Private
const confirmOrderDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (order.user_id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized profile access' });
      }

      if (order.status !== 'shipped') {
        return res.status(400).json({ message: 'Only shipped orders can be confirmed for delivery' });
      }

      order.status = 'delivered';
      if (order.payment_status !== 'paid') {
        order.payment_status = 'paid';
      }

      const updatedOrder = await order.save();

      // Update User Loyalty
      if (updatedOrder.user_id) {
        try {
          const user = await User.findById(updatedOrder.user_id);
          const cmsConfig = await CMS.findOne({ key: 'global_config' });
          
          if (user && cmsConfig) {
            const thresholds = cmsConfig.data || {};
            const plat = thresholds.tierPlatinumThreshold || 1000;
            const gold = thresholds.tierGoldThreshold || 500;
            
            user.totalSpent = (user.totalSpent || 0) + updatedOrder.total_amount;
            
            if (user.totalSpent >= plat) {
              user.loyaltyTier = 'Platinum';
            } else if (user.totalSpent >= gold) {
              user.loyaltyTier = 'Gold';
            } else {
              user.loyaltyTier = 'Member';
            }
            
            await user.save();
          }
        } catch (err) {
          console.error('Loyalty update failed:', err.message);
        }
      }

      // Notify through socket if needed (though user is already here, admin dashboard might need it)
      try {
        getIO().emit('adminOrderUpdate', {
          orderId: updatedOrder._id,
          status: 'delivered'
        });
      } catch (err) {
        console.error('Socket emit failed:', err.message);
      }

      const resOrder = updatedOrder.toObject();
      resOrder.id = resOrder._id;
      resOrder.created_at = resOrder.createdAt;

      res.json(resOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Track an order by ID (Public)
// @route   GET /api/orders/track/:id
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const id = req.params.id;
    let order;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    
    // Support searching by the 6-character short ID (ORD-XXXXXX, #ORD-XXXXXX, or just XXXXXX)
    if (!order) {
      const shortId = id.toUpperCase().replace('ORD-', '').replace('#', '').trim();
      if (shortId.length >= 6) {
        // Use $expr with $toString to allow regex prefix matching on the ObjectId
        const orders = await Order.find({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: "^" + shortId.toLowerCase(),
              options: "i"
            }
          }
        });
        if (orders.length > 0) order = orders[0];
      }
    }
    
    if (!order) {
      order = await Order.findOne({ paymob_order_id: id });
    }

    if (order) {
      // Return safe, public tracking data only
      res.json({
        id: order._id,
        status: order.status,
        created_at: order.createdAt,
        // Mock expected delivery: 3 days after creation
        expected_delivery: new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) 
      });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid Order ID format' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
  confirmOrderDelivery,
  trackOrder,
};
