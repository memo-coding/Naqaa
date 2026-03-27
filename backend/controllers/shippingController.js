const ShippingCompany = require('../models/ShippingCompany');
const Order = require('../models/Order');

// @desc  Get all shipping companies
// @route GET /api/shipping
// @access Private/Admin
const getShippingCompanies = async (req, res) => {
  try {
    const companies = await ShippingCompany.find({}).sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Create shipping company
// @route POST /api/shipping
// @access Private/Admin
const createShippingCompany = async (req, res) => {
  try {
    const company = new ShippingCompany(req.body);
    const saved = await company.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Update shipping company
// @route PUT /api/shipping/:id
// @access Private/Admin
const updateShippingCompany = async (req, res) => {
  try {
    const company = await ShippingCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Shipping company not found' });

    const { name, name_ar, phone, contact_email, fees_per_order, notes, is_active } = req.body;
    if (name !== undefined) company.name = name;
    if (name_ar !== undefined) company.name_ar = name_ar;
    if (phone !== undefined) company.phone = phone;
    if (contact_email !== undefined) company.contact_email = contact_email;
    if (fees_per_order !== undefined) company.fees_per_order = fees_per_order;
    if (notes !== undefined) company.notes = notes;
    if (is_active !== undefined) company.is_active = is_active;

    const updated = await company.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc  Delete shipping company
// @route DELETE /api/shipping/:id
// @access Private/Admin
const deleteShippingCompany = async (req, res) => {
  try {
    const company = await ShippingCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Shipping company not found' });

    // Check for active (undelivered) orders linked to this company
    const activeOrders = await Order.find({
      shipping_company_id: req.params.id,
      status: { $in: ['pending', 'processing', 'shipped'] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        message: `لا يمكن حذف الشركة. يوجد ${activeOrders.length} طلب نشط مرتبط بها (في انتظار الشحن أو جاري تسليمه). قم بإنهاء أو نقل هذه الطلبات أولاً.`,
        blocking_orders: activeOrders.length
      });
    }

    // Check for unsettled balances
    const hasUnsettledFees = (company.fees_owed || 0) > 0;
    const hasUnsettledCod = (company.cod_pending || 0) > 0;
    if (hasUnsettledFees || hasUnsettledCod) {
      const parts = [];
      if (hasUnsettledFees) parts.push(`مصاريف شحن مستحقة ${company.fees_owed.toFixed(2)} EGP`);
      if (hasUnsettledCod) parts.push(`مبالغ COD ${company.cod_pending.toFixed(2)} EGP`);
      return res.status(400).json({
        message: `لا يمكن حذف الشركة. يوجد أرصدة غير مُسوّاة: ${parts.join(' + ')}. قم بتسوية الأرصدة أولاً.`,
      });
    }

    await ShippingCompany.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shipping company removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc  Update balance manually (settle fees or COD)
// @route PUT /api/shipping/:id/balance
// @access Private/Admin
const adjustBalance = async (req, res) => {
  try {
    const company = await ShippingCompany.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Shipping company not found' });

    const { type, amount, note } = req.body;
    // type: 'fees' = settling fees_owed (store paid company), 'cod' = marking cod as received
    const num = Math.abs(Number(amount));
    if (isNaN(num) || num === 0) return res.status(400).json({ message: 'Invalid amount' });

    if (type === 'fees') {
      company.fees_owed = Math.max(0, company.fees_owed - num);
    } else if (type === 'cod') {
      company.cod_pending = Math.max(0, company.cod_pending - num);
    } else {
      // Legacy fallback
      company.balance += Number(req.body.adjustment || 0);
    }

    if (note) company.notes = (company.notes ? company.notes + '\n' : '') + `[${new Date().toLocaleDateString()}] ${note}`;
    const updated = await company.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getShippingCompanies,
  createShippingCompany,
  updateShippingCompany,
  deleteShippingCompany,
  adjustBalance,
};
