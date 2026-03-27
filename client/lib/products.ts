export interface Product {
  id: number;
  name: string;
  name_ar: string;
  price: number;
  category: string;
  category_ar: string;
  img: string;
  description: string;
  description_ar: string;
  benefits?: string[];
  benefits_ar?: string[];
  ingredients?: { name: string; name_ar: string; desc: string; desc_ar: string }[];
  usage?: string[];
  usage_ar?: string[];
  rarity?: 'common' | 'rare' | 'exotic' | 'mythic' | 'artifact';
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Rainforest Hydration Mask',
    name_ar: 'قناع ترطيب الغابة المطيرة',
    price: 120,
    category: 'Exotics',
    category_ar: 'الغريبة',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxZf9gNjlfRWI5XQbluLi_68dOJKUZBKFWS3BxPB1vX4AIDE0aNaZLKjwqtuw2EzXQyxrBSbF1p1mFBseL9vr-VGmSkSySP2JpCPULUcW7Leogp1ni1RNPxlTwYCSgvP0cL1Q_DhWIkZa9X7ZTB6g-Yqp2EkA2GjrBXctdOJ5uRN2kLBra3qd1-hHqCly2VQqtNnooY0SVSdF1VArYAfVu9fSMs9TeZZnsfqo_YHw7k-YetpnOFjxOgHcW_L6rig_Ew5mUG5lLQbJ3',
    description: 'Deep restoration using fermented orchid root and volcanic silt for ultimate hair health.',
    description_ar: 'استعادة عميقة باستخدام جذر الأوركيد المخمّر والطمي البركاني لصحة الشعر النهائية.',
    rarity: 'rare',
    benefits: ['Intense Hydration', 'Color Protection', 'Frizz Control'],
    benefits_ar: ['ترطيب مكثف', 'حماية اللون', 'التحكم في التجعد'],
    ingredients: [
      { name: 'Orchid Root', name_ar: 'جذر الأوركيد', desc: 'Moisture lock', desc_ar: 'قفل الرطوبة' }
    ]
  },
  {
    id: 2,
    name: 'Bioluminescent Gloss Oil',
    name_ar: 'زيت اللمعان الحيوي',
    price: 48,
    category: 'Succulents',
    category_ar: 'العصاريات',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQsuC_KX_ei-VP6MfGqymYvhqjwvBMWVLKB0NO1AWR8n7wq7ru5HDEWtTsRm65bjsyB5O8rA5Ac_8iaiGefK-v9ypv_tBAAtJIHVsfrt2guMIY2FHXoxodRpJGmQKjIbUdbqQDgNXPEShvpSr92Ce4ov_T8UPGtaC9BhMKoUJQg1KR6it6Sok-cpXnboV0l7OeL-87g4hNlmTEt-eHc7QjCjX4ZHJYMJfOUaBco_R6p4J-k3YGC8nEaeFqexgFGQ3kLBuylPv0kDa4',
    description: 'A revolutionary blend that mimics deep-sea bioluminescence for unparalleled radiance.',
    description_ar: 'مزيج ثوري يحاكي الضوء الحيوي لأعماق البحار لإشراق لا مثيل له.',
    rarity: 'exotic'
  },
  {
    id: 3,
    name: 'Fern Fiber Gel',
    name_ar: 'جل ألياف السرخس',
    price: 36,
    category: 'Ground Cover',
    category_ar: 'الغطاء الأرضي',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_L7NkFSvp3jBJZRk2AxvIVOFr2Wc0OJvtbYzBbgn8Sz58dqSYDfO2tKJF5oVKqjem-dQMvdkaZblWl6zoPz_Ak6cZqeWK7SG_R_oif0T75pbYXVc3xikIVVA0kXY_KtA7vR5gzc6TWOG4qtXWrytz2B8PXYiuRsgOOqmX4o55_AfE_Fx5IdWhowcSkvVlgn9M9wFtd6nxv1PrQ-8gglMFOhDubXOEYMk4u0oXP11y7xn6EHVvFZhOzN1aL0jyOfQ-MnJIy8RmClHt',
    description: 'Natural holding power derived from ancient fern fibers for long-lasting curls.',
    description_ar: 'قوة ثبات طبيعية مستمدة من ألياف السرخس القديمة لتجعيدات تدوم طويلاً.',
    rarity: 'common'
  },
  {
    id: 4,
    name: 'Desert Cactus Elixir',
    name_ar: 'إكسير صبار الصحراء',
    price: 85,
    category: 'Succulents',
    category_ar: 'العصاريات',
    img: 'https://images.unsplash.com/photo-1556227702-d1e4e7ca563a?w=800&auto=format&fit=crop',
    description: 'Extreme moisture retention for hair that survives the harshest conditions.',
    description_ar: 'احتباس فائق للرطوبة للشعر الذي ينجو في أقسى الظروف.',
    rarity: 'rare'
  },
  {
    id: 5,
    name: 'Morning Mist Mist',
    name_ar: 'رذاذ ضباب الصباح',
    price: 24,
    category: 'Ground Cover',
    category_ar: 'الغطاء الأرضي',
    img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop',
    description: 'Refreshing morning dew in a bottle for reviving tired curls instantly.',
    description_ar: 'ندى الصباح المنعش في زجاجة لإحياء التجعيدات المتعبة فوراً.',
    rarity: 'common'
  },
  {
    id: 6,
    name: 'Ancient Moss Serum',
    name_ar: 'مصل الطحلب القديم',
    price: 156,
    category: 'Exotics',
    category_ar: 'الغريبة',
    img: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?w=800&auto=format&fit=crop',
    description: 'Time-reversal serum using extraction from 500-year-old glacier moss.',
    description_ar: 'مصل عكس الزمن باستخدام مستخلص من طحالب الأنهار الجليدية التي يبلغ عمرها 500 عام.',
    rarity: 'mythic'
  },
  {
    id: 7,
    name: 'Creeping Vine Conditioner',
    name_ar: 'بلسم الكرمة الزاحفة',
    price: 42,
    category: 'Climbers',
    category_ar: 'المتسلقات',
    img: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=800&auto=format&fit=crop',
    description: 'Detangling magic that mimics the flexibility of tropical vines.',
    description_ar: 'سحر فك التشابك الذي يحاكي مرونة الكروم الاستوائية.',
    rarity: 'common'
  },
  {
    id: 8,
    name: 'Highland Peak Shampoo',
    name_ar: 'شامبو مرتفعات الهضاب',
    price: 38,
    category: 'Climbers',
    category_ar: 'المتسلقات',
    img: 'https://images.unsplash.com/photo-1512203530485-25a2ae209a6d?w=800&auto=format&fit=crop',
    description: 'Purifying wash using cold-pressed mountain herbs and clean snow water.',
    description_ar: 'غسول منقي باستخدام أعشاب جبلية معصورة على البارد ومياه ثلج نقية.',
    rarity: 'common'
  }
];
