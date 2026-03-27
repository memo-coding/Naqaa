const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  category_id: { type: Number, default: 0 },
  img: { type: String },
  is_active: { type: Boolean, default: true },
  storage_zone: { type: String, default: '' },
  scientific_name_en: { type: String, default: 'SCIENTIFIC' },
  scientific_name_ar: { type: String, default: 'علمي' },
  scientific_desc_en: { type: String, default: 'CLINICALLY TESTED' },
  scientific_desc_ar: { type: String, default: 'مختبر سريرياً' },
  organic_name_en: { type: String, default: 'ORGANIC' },
  organic_name_ar: { type: String, default: 'عضوي' },
  organic_desc_en: { type: String, default: 'SUSTAINABLY SOURCED' },
  organic_desc_ar: { type: String, default: 'مستدام المصدر' },
  key_ingredients_en: { type: String, default: '' },
  key_ingredients_ar: { type: String, default: '' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
