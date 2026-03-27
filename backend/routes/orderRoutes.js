const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
  confirmOrderDelivery,
  trackOrder,
} = require('../controllers/orderController');
const { protect, admin, resolveUser } = require('../middleware/authMiddleware');

router.route('/myorders').get(protect, getMyOrders);
router.route('/myorders/:id/confirm').put(protect, confirmOrderDelivery);
router.route('/track/:id').get(trackOrder);

router.route('/')
  .post(resolveUser, createOrder)
  .get(protect, admin, getOrders);

router.route('/:id/status')
  .put(protect, admin, updateOrderStatus);

module.exports = router;
