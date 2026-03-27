const mongoose = require('mongoose');

const shippingCompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_ar: { type: String },
  phone: { type: String },
  contact_email: { type: String },
  fees_per_order: { type: Number, default: 0 }, // Fixed fee per shipment
  fees_owed: { type: Number, default: 0 },       // Fees store owes company (card/wallet orders only)
  cod_pending: { type: Number, default: 0 },     // COD cash company collected from customers, must return to store
  balance: { type: Number, default: 0 },         // Legacy field (kept for migration safety)
  total_orders: { type: Number, default: 0 },    // Count of orders shipped via this company
  notes: { type: String },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingCompany', shippingCompanySchema);
