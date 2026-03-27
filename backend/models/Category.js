const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  category_id: { type: Number }, // For compatibility with Product.category_id
  slug: { type: String, unique: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
