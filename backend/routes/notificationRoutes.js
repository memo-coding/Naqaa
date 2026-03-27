const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getAdminNotifications,
  markAsRead,
  markAllUserAsRead,
  markAllAdminAsRead,
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getUserNotifications);
router.put('/read-all', protect, markAllUserAsRead);

router.get('/admin', protect, admin, getAdminNotifications);
router.put('/admin/read-all', protect, admin, markAllAdminAsRead);

router.put('/:id/read', protect, markAsRead);

module.exports = router;
