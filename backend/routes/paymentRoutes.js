const express = require('express');
const router = express.Router();
const { initiatePaymobPayment, handlePaymobWebhook } = require('../controllers/paymentController');

// @route   POST /api/payment/paymob/initiate
// @access  Public (should ideally be protected, but frontend logic handles it for now)
router.post('/paymob/initiate', initiatePaymobPayment);

// @route   POST /api/payment/paymob/webhook
// @access  Public (called by Paymob servers)
router.post('/paymob/webhook', handlePaymobWebhook);

module.exports = router;
