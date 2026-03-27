const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getShippingCompanies,
  createShippingCompany,
  updateShippingCompany,
  deleteShippingCompany,
  adjustBalance,
} = require('../controllers/shippingController');

router.get('/', protect, admin, getShippingCompanies);
router.post('/', protect, admin, createShippingCompany);
router.put('/:id', protect, admin, updateShippingCompany);
router.delete('/:id', protect, admin, deleteShippingCompany);
router.put('/:id/balance', protect, admin, adjustBalance);

module.exports = router;
