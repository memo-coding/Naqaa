const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  total_amount: { type: Number, required: true },
  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true },
  customer_phone: { type: String, required: true },
  shipping_address: { type: String, required: true },
  shipping_city: { type: String, required: true },
  shipping_country: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancelled_no_refund'], default: 'pending' },
  notes: { type: String },
  payment_method: { type: String, enum: ['card', 'wallet', 'manual'], default: 'card' },
  payment_status: { type: String, enum: ['paid', 'unpaid', 'pending', 'failed', 'refunded'], default: 'pending' },
  paymob_order_id: { type: String, default: null },
  shipping_company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingCompany', default: null },
  shipping_company_name: { type: String, default: null },
  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number },
      price: { type: Number },
      name: { type: String },
      img: { type: String }
    }
  ],
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
