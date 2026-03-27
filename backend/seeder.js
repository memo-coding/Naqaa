const dns = require('dns');
// Override DNS to use Google's public DNS (local DNS blocks SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const path = require('path');
// Explicitly load .env from this directory, bypassing dotenvx injection
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');
const CMS = require('./models/CMS');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

// ── Seed Data ──────────────────────────────────────────────────────────────

const users = [
  {
    name: 'Admin',
    email: 'admin@verdant.bio',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    password: 'Customer123!',
    role: 'customer',
  },
];

const products = [
  {
    name: 'Hydrating Curl Cream',
    name_ar: 'كريم الشعر المجعد المرطب',
    price: 34.99,
    stock: 120,
    category_id: 1,
    img: 'https://images.unsplash.com/photo-1669395222400-23e1e3c0d0d7?w=400',
    is_active: true,
  },
  {
    name: 'Botanical Hair Serum',
    name_ar: 'سيروم الشعر النباتي',
    price: 49.99,
    stock: 85,
    category_id: 1,
    img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400',
    is_active: true,
  },
  {
    name: 'Deep Conditioning Mask',
    name_ar: 'قناع العناية العميقة',
    price: 29.99,
    stock: 60,
    category_id: 2,
    img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
    is_active: true,
  },
  {
    name: 'Scalp Revive Oil',
    name_ar: 'زيت تجديد فروة الرأس',
    price: 39.99,
    stock: 45,
    category_id: 2,
    img: 'https://images.unsplash.com/photo-1631390050558-95ffbf6a0e7e?w=400',
    is_active: true,
  },
  {
    name: 'Volumizing Shampoo',
    name_ar: 'شامبو تكثيف الحجم',
    price: 24.99,
    stock: 200,
    category_id: 3,
    img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400',
    is_active: true,
  },
  {
    name: 'Argan Repair Conditioner',
    name_ar: 'بلسم إصلاح بزيت الأرغان',
    price: 27.99,
    stock: 8,
    category_id: 3,
    img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
    is_active: true,
  },
  {
    name: 'Leave-In Curl Activator',
    name_ar: 'منشط تجعيد بدون شطف',
    price: 22.99,
    stock: 0,
    category_id: 1,
    img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
    is_active: false,
  },
  {
    name: 'Detangling Spray',
    name_ar: 'بخاخ فك التشابك',
    price: 18.99,
    stock: 150,
    category_id: 4,
    img: 'https://images.unsplash.com/photo-1668702765219-571bbde97e13?w=400',
    is_active: true,
  },
];

const categories = [
  { category_id: 1, name: 'Curl Care', name_ar: 'العناية بالشعر المجعد', slug: 'curl-care', order: 1 },
  { category_id: 2, name: 'Scalp Health', name_ar: 'صحة فروة الرأس', slug: 'scalp-health', order: 2 },
  { category_id: 3, name: 'Essential Care', name_ar: 'العناية الأساسية', slug: 'essential-care', order: 3 },
  { category_id: 4, name: 'Styling', name_ar: 'التصفيف', slug: 'styling', order: 4 },
];

const cmsData = {
  key: 'global_config',
  data: {
heroBadge_en: 'Natural & Organic',
  heroBadge_ar: 'منتجات طبيعية وحيوية',
  heroTitle_en: 'NOURISH YOUR NATURAL CURLS WITH PURE BOTANICALS',
  heroTitle_ar: 'غذّي شعرك الطبيعي بالنباتات النقية',
  heroDesc_en: 'Premium organic solutions for vibrant, healthy hair. Experience the power of nature combined with molecular science.',
  heroDesc_ar: 'حلول عضوية فاخرة لشعر حيوي وصحي. اختبر قوة الطبيعة مجتمعة مع العلم الجزيئي.',
  heroCTA1_en: 'SHOP COLLECTION',
  heroCTA1_ar: 'تصفح المنتجات',
  heroCTA2_en: 'QUICK CHECKOUT',
  heroCTA2_ar: 'شراء سريع',
  heroImg: '/hero-image.png',
  logoUrl: '',
  logoType: 'text',
  brandName_en: 'Naqaa',
  brandName_ar: 'نقاء الطبيعة',
  verdictTitle_en: 'Customer Reviews',
  verdictTitle_ar: 'تقييمات العملاء',
  verdictSubtitle_en: 'What Our Customers Say',
  verdictSubtitle_ar: 'ماذا يقول عملاؤنا',
  // Featured section
  featuredBadge_en: 'Customer Favorites',
  featuredBadge_ar: 'المفضل لدى العملاء',
  featuredTitle_en: 'Curated Selection',
  featuredTitle_ar: 'اختياراتنا المميزة',
  featuredDesc_en: 'Discover our handpicked botanical essentials for every hair type.',
  featuredDesc_ar: 'اكتشفي منتجاتنا المختارة من المستخلصات النباتية الطبيعية لكل أنواع الشعر.',
  featuredProductIds: [],
  // Newsletter defaults
  newsletterTitle_en: 'Get the latest products and offers',
  newsletterTitle_ar: 'أحصل على احدث المنتجات والعروض',
  newsletterDesc_en: 'Get notified about the latest products and offers via email',
  newsletterDesc_ar: 'أحصل على إشعارات بأحدث المنتجات والعروض عبر بريدك الإلكتروني',
  newsletterCTA_en: 'JOIN NOW',
  newsletterCTA_ar: 'إنضم الآن',
  // Footer defaults
  footerHeading_en: 'Naqaa',
  footerHeading_ar: 'نقاء',
  footerDesc_en: 'Premium organic solutions for vibrant, healthy hair. Experience the power of nature combined with molecular science.',
  footerDesc_ar: 'منتجات طبيعية 100% للعناية بشعرك',
  footerCopyright_en: '© 2026 Naqaa. All Rights Reserved.',
  footerCopyright_ar: '© 2026 نقاء. جميع الحقوق محفوظة.',
  // Loyalty Tiers
  tierPlatinumThreshold: 1000,
  tierGoldThreshold: 500,
  shippingFee: 0,
  }
};

// ── Destroy / Import ────────────────────────────────────────────────────────

const importData = async () => {
  await connectDB();
  try {
    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    await CMS.deleteMany();

    console.log('Old data cleared.');

    // Insert products (no hashing needed)
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ ${createdProducts.length} products seeded.`);

    // Insert users (password hashing handled by User model pre-save hook)
    for (const u of users) {
      await User.create(u);
    }
    console.log(`✅ ${users.length} users seeded.`);

    // Insert categories
    await Category.insertMany(categories);
    console.log(`✅ ${categories.length} categories seeded.`);

    // Insert CMS data
    await CMS.create(cmsData);
    console.log('✅ CMS default configuration seeded.');

    // Retrieve seeded documents to use their ObjectIds
    const dbCustomer = await User.findOne({ email: 'sara@example.com' });
    const product1 = createdProducts[0];
    const product2 = createdProducts[1];
    const product3 = createdProducts[2];

    // Create Dummy Orders for Analytics Map testing
    const baseDate = new Date();
    const dummyOrders = [
      {
        user_id: dbCustomer._id,
        total_amount: 119.97,
        customer_name: 'Sara Ahmed',
        customer_email: 'sara@example.com',
        customer_phone: '+201011122233',
        shipping_address: '123 Nile Street',
        shipping_city: 'Cairo', // Lights up Cairo node
        shipping_country: 'Egypt',
        status: 'delivered',
        created_at: new Date(new Date().setMonth(baseDate.getMonth() - 1)), // last month
        items: [
          { product_id: product1._id, name: product1.name, price: product1.price, quantity: 2, img: product1.img },
          { product_id: product2._id, name: product2.name, price: product2.price, quantity: 1, img: product2.img }
        ]
      },
      {
        user_id: dbCustomer._id,
        total_amount: 89.98,
        customer_name: 'Omar Tarek',
        customer_email: 'omar@example.com',
        customer_phone: '+201122334455',
        shipping_address: '45 Sea View Road',
        shipping_city: 'Alexandria', // Lights up Alexandria node
        shipping_country: 'Egypt',
        status: 'shipped',
        created_at: new Date(new Date().setMonth(baseDate.getMonth() - 3)), // 3 months ago
        items: [
          { product_id: product3._id, name: product3.name, price: product3.price, quantity: 3, img: product3.img }
        ]
      },
      {
        user_id: dbCustomer._id,
        total_amount: 54.98,
        customer_name: 'Mona Ali',
        customer_email: 'mona@example.com',
        customer_phone: '+201255667788',
        shipping_address: '10 Pyramid Avenue',
        shipping_city: 'Giza', // Lights up Giza node
        shipping_country: 'Egypt',
        status: 'pending',
        created_at: new Date(new Date().setMonth(baseDate.getMonth() - 6)), // 6 months ago
        items: [
          { product_id: product1._id, name: product1.name, price: product1.price, quantity: 1, img: product1.img },
          { product_id: product3._id, name: product3.name, price: product3.price, quantity: 1, img: product3.img } // Use an existing product!
        ]
      },
      {
        user_id: dbCustomer._id,
        total_amount: 24.99,
        customer_name: 'Khaled Youssef',
        customer_email: 'khaled@example.com',
        customer_phone: '+201509988776',
        shipping_address: 'El Gomhouria St',
        shipping_city: 'Mansoura', // Lights up Dakahlia node
        shipping_country: 'Egypt',
        status: 'processing',
        created_at: new Date(), // this month
        items: [
          { product_id: product2._id, name: product2.name, price: product2.price, quantity: 1, img: product2.img } // Use an existing product!
        ]
      }
    ];

    const createdOrders = await Order.insertMany(dummyOrders);
    console.log(`✅ ${createdOrders.length} test orders seeded (mapped to governorates).`);

    console.log('\n=== Seed Complete ===');
    console.log('Admin login:');
    console.log('  Email:    admin@verdant.bio');
    console.log('  Password: Admin123!');
    console.log('\nCustomer login:');
    console.log('  Email:    sara@example.com');
    console.log('  Password: Customer123!');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

const destroyData = async () => {
  await connectDB();
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    console.log('All data destroyed.');
    process.exit(0);
  } catch (err) {
    console.error('Error destroying data:', err);
    process.exit(1);
  }
};

// Run with:  node seeder.js          → import
//            node seeder.js -d       → destroy
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
