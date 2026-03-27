const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
  getUsers,
  getAdminEmail,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/admin-email', getAdminEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, admin, getUsers);

module.exports = router;
