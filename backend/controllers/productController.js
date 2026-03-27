const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Removed hardcoded CATEGORY_MAP in favor of dynamic DB categories

// @desc    Get all active products (public) or all products (admin)
// @route   GET /api/products
// @access  Public / Private for Admin
const getProducts = async (req, res) => {
  try {
    // If admin, they could pass a query parm to see all, or default to all. 
    // Usually, public sees only is_active=true. 
    // We will return all for now to keep frontend logic similar to before, or filter query
    const filter = req.query.admin === 'true' ? {} : { is_active: true };
    // actually, let's just return all and let frontend decide or based on token?
    // Let's just return all to simplify migrating the existing admin logic which pulls everything
    const products = await Product.find({});
    
    // Fetch all categories to create a metadata map
    const categories = await Category.find();
    const catMap = {};
    categories.forEach(c => {
      // Map by category_id (if exists) or _id
      const key = c.category_id !== undefined ? c.category_id.toString() : c._id.toString();
      catMap[key] = { name: c.name, name_ar: c.name_ar };
    });

    // Map _id to id to maintain compatibility with Supabase frontend payload
    const formattedProducts = products.map(p => {
      const pObj = p.toObject();
      return { 
        ...pObj, 
        id: pObj._id,
        categories: catMap[pObj.category_id?.toString()] || null 
      };
    });
    
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const pObj = product.toObject();
      const categoryQuery = { $or: [{ category_id: pObj.category_id }] };
      if (mongoose.Types.ObjectId.isValid(pObj.category_id)) {
        categoryQuery.$or.push({ _id: pObj.category_id });
      }
      const category = await Category.findOne(categoryQuery);
      res.json({ 
        ...pObj, 
        id: pObj._id,
        categories: category ? { name: category.name, name_ar: category.name_ar } : null
      });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Invalid product ID' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { 
    name, name_ar, price, stock, category_id, img, is_active,
    scientific_name_en, scientific_name_ar, scientific_desc_en, scientific_desc_ar,
    organic_name_en, organic_name_ar, organic_desc_en, organic_desc_ar,
    key_ingredients_en, key_ingredients_ar
  } = req.body;
  
  try {
    const product = new Product({
      name, name_ar, price, stock, category_id, img, is_active,
      scientific_name_en, scientific_name_ar, scientific_desc_en, scientific_desc_ar,
      organic_name_en, organic_name_ar, organic_desc_en, organic_desc_ar,
      key_ingredients_en, key_ingredients_ar
    });

    const createdProduct = await product.save();
    
    // Format id
    const resProduct = createdProduct.toObject();
    resProduct.id = resProduct._id;
    
    res.status(201).json(resProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { 
    name, name_ar, price, stock, category_id, img, is_active,
    scientific_name_en, scientific_name_ar, scientific_desc_en, scientific_desc_ar,
    organic_name_en, organic_name_ar, organic_desc_en, organic_desc_ar,
    key_ingredients_en, key_ingredients_ar
  } = req.body;
  
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      product.name = name ?? product.name;
      product.name_ar = name_ar ?? product.name_ar;
      product.price = price ?? product.price;
      product.stock = stock ?? product.stock;
      product.category_id = category_id ?? product.category_id;
      product.img = img ?? product.img;
      product.is_active = is_active ?? product.is_active;

      product.scientific_name_en = scientific_name_en ?? product.scientific_name_en;
      product.scientific_name_ar = scientific_name_ar ?? product.scientific_name_ar;
      product.scientific_desc_en = scientific_desc_en ?? product.scientific_desc_en;
      product.scientific_desc_ar = scientific_desc_ar ?? product.scientific_desc_ar;

      product.organic_name_en = organic_name_en ?? product.organic_name_en;
      product.organic_name_ar = organic_name_ar ?? product.organic_name_ar;
      product.organic_desc_en = organic_desc_en ?? product.organic_desc_en;
      product.organic_desc_ar = organic_desc_ar ?? product.organic_desc_ar;

      product.key_ingredients_en = key_ingredients_en ?? product.key_ingredients_en;
      product.key_ingredients_ar = key_ingredients_ar ?? product.key_ingredients_ar;

      const updatedProduct = await product.save();
      
      const resProduct = updatedProduct.toObject();
      resProduct.id = resProduct._id;
      
      res.json(resProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
