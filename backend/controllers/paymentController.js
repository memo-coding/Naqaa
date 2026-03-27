const Order = require('../models/Order');
const crypto = require('crypto');

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID_CARD = process.env.PAYMOB_INTEGRATION_ID_CARD;
const PAYMOB_INTEGRATION_ID_WALLET = process.env.PAYMOB_INTEGRATION_ID_WALLET;
const PAYMOB_INTEGRATION_ID_INSTAPAY = process.env.PAYMOB_INTEGRATION_ID_INSTAPAY;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC = process.env.PAYMOB_HMAC;

exports.initiatePaymobPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.payment_method === 'manual') {
       return res.status(400).json({ message: 'Pay on delivery orders do not require Paymob processing' });
    }
    // 1. Idempotency Check: Don't allow initiating payment if already paid/refunded
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      return res.status(400).json({ message: `Payment already ${order.payment_status}. Initiation aborted.` });
    }

    // 2. Authentication Request
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY || 'dummy_api_key_replace_me_in_env' })
    });
    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
      console.error('Paymob Auth Failed:', authData);
      throw new Error('Failed to authenticate with Paymob');
    }

    // 2. Order Registration Request
    const amount_cents = Math.round(order.total_amount * 100);

    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: amount_cents.toString(),
        currency: 'EGP',
        merchant_order_id: `VERDANT-${order._id}-${Date.now()}`,
        items: []
      })
    });
    const orderData = await orderRes.json();
    const paymobOrderId = orderData.id;

    if (!paymobOrderId) {
      console.error('Paymob Order Creation Failed:', orderData);
      throw new Error('Failed to register order with Paymob');
    }

    // 3. Payment Key Generation Request
    let integrationId = PAYMOB_INTEGRATION_ID_CARD;
    if (paymentMethod === 'wallet') integrationId = PAYMOB_INTEGRATION_ID_WALLET;
    else if (paymentMethod === 'instapay') integrationId = PAYMOB_INTEGRATION_ID_INSTAPAY;
    
    const billingData = {
      apartment: "NA",
      email: order.customer_email || "customer@example.com",
      floor: "NA",
      first_name: order.customer_name?.split(' ')[0] || "Customer",
      street: order.shipping_address || "NA",
      building: "NA",
      phone_number: order.customer_phone || "+201000000000",
      shipping_method: "PKG",
      postal_code: "NA",
      city: order.shipping_city || "NA",
      country: "EG",
      last_name: order.customer_name?.split(' ').slice(1).join(' ') || "Name",
      state: "NA"
    };

    const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amount_cents.toString(),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: integrationId || '2456019' // Fallback dummy integration ID
      })
    });
    const paymentKeyData = await paymentKeyRes.json();
    const paymentKey = paymentKeyData.token;

    if (!paymentKey) {
      console.error('Paymob Payment Key Generation Failed:', paymentKeyData);
      throw new Error('Failed to generate payment key from Paymob');
    }

    // Update local order with Paymob order ID
    order.paymob_order_id = paymobOrderId;
    // ensure payment_status is pending initially
    if (order.payment_status !== 'paid') {
      order.payment_status = 'pending';
    }
    await order.save();

    // 4. Handle Redirection / Iframe
    if (paymentMethod === 'wallet') {
      // Wallet flow: POST to payments/pay with source (phone number)
      // Sanitize phone: remove any non-digit characters and ensure it starts with 01 for Egypt if applicable
      let phone = (order.customer_phone || "").replace(/\D/g, '');
      if (phone.startsWith('20')) phone = phone.substring(2);
      if (!phone.startsWith('0')) phone = '0' + phone; 

      console.log(`Initiating wallet payment for phone: ${phone}`);

      const walletPayRes = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            identifier: phone || "01000000000",
            subtype: "WALLET"
          },
          payment_token: paymentKey
        })
      });
      const walletPayData = await walletPayRes.json();
      
      if (walletPayData.redirect_url) {
        return res.status(200).json({ iframeUrl: walletPayData.redirect_url });
      } else {
        const errorMessage = (walletPayData.data && walletPayData.data.message) 
            || walletPayData.message 
            || 'Failed to get wallet redirection URL';
        console.error('Paymob Wallet Pay Failed. Response:', JSON.stringify(walletPayData, null, 2));
        throw new Error(errorMessage);
      }
    } else if (paymentMethod === 'instapay') {
      // InstaPay flow: typically uses a standard Paymob checkout frame natively linked to the InstaPay Integration ID
      // If no specific IFRAME_ID is set for InstaPay, it uses the default one which dynamically handles the integration_id
      const iframeId = process.env.PAYMOB_IFRAME_ID_INSTAPAY || PAYMOB_IFRAME_ID || '320076';
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
      res.status(200).json({ iframeUrl });
    } else {
      // Card flow: Return Iframe URL
      const iframeId = PAYMOB_IFRAME_ID || '320076'; // Fallback dummy iframe ID
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
      res.status(200).json({ iframeUrl });
    }
  } catch (err) {
    console.error('Paymob Initiation Error:', err);
    res.status(500).json({ message: 'Payment gateway error', error: err.message });
  }
};

exports.handlePaymobWebhook = async (req, res) => {
  try {
    const { hmac } = req.query;
    const body = req.body;

    if (!body || !body.obj) {
      return res.status(400).send('Invalid webhook structure');
    }

    const obj = body.obj;
    const hmacKeys = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success'
    ];

    let concatenatedString = '';
    hmacKeys.forEach(k => {
      let val;
      if (k === 'order') {
        val = obj.order ? obj.order.id : '';
      } else if (k.includes('.')) {
        const parts = k.split('.');
        val = obj[parts[0]] ? obj[parts[0]][parts[1]] : '';
      } else {
        val = obj[k];
      }
      
      if (val === true) val = 'true';
      if (val === false) val = 'false';
      if (val === null || val === undefined) val = '';
      
      concatenatedString += val;
    });

    if (PAYMOB_HMAC && hmac) {
      const calculatedHmac = crypto.createHmac('sha512', PAYMOB_HMAC).update(concatenatedString).digest('hex');
      if (calculatedHmac !== hmac) {
        console.warn('Invalid Paymob HMAC signature received');
        return res.status(401).send('Unauthorized: Invalid Signature');
      }
    }

    const paymobOrderId = obj.order ? obj.order.id : null;
    const isSuccess = obj.success;

    if (!paymobOrderId) {
      return res.status(400).send('No order ID in payload');
    }

    const order = await Order.findOne({ paymob_order_id: paymobOrderId });
    
    if (order) {
      if (obj.is_refunded === true || obj.is_refunded === 'true') {
        order.payment_status = 'refunded';
      } else if (isSuccess === true || isSuccess === 'true') {
        // Amount Validation Check
        const expectedCents = Math.round(order.total_amount * 100);
        const actualCents = parseInt(obj.amount_cents);

        if (expectedCents !== actualCents) {
           console.warn(`Paymob Amount Mismatch! Expected: ${expectedCents}, Actual: ${actualCents} for Order ID: ${order._id}`);
           // We do not mark as paid because amounts don't match. Could be a hack attempt.
           order.payment_status = 'failed';
        } else {
           order.payment_status = 'paid';
        }
      } else {
        order.payment_status = 'failed';
        // Wait, if manual is unpaid, failed makes sense.
      }
      await order.save();
      
      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();
        if (io && order.user_id) {
           io.to(order.user_id.toString()).emit('paymentStatusUpdate', { orderId: order._id, paymentStatus: order.payment_status });
        }
      } catch (socketErr) {
        // Socket error shouldn't crash webhook response
      }
    } else {
      console.warn(`Webhook received for unknown Paymob Order ID: ${paymobOrderId}`);
    }

    // Acknowledge receipt to Paymob
    res.status(200).send('Webhook Processed');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Internal Server Error');
  }
};
