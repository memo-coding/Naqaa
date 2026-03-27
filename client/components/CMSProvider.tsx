'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useSocket } from './SocketProvider';

interface CMSData {
  heroTitle_en: string;
  heroTitle_ar: string;
  heroBadge_en: string;
  heroBadge_ar: string;
  heroDesc_en: string;
  heroDesc_ar: string;
  heroCTA1_en: string;
  heroCTA1_ar: string;
  heroCTA2_en: string;
  heroCTA2_ar: string;
  heroImg: string;
  logoUrl: string;
  logoType: 'text' | 'image';
  brandName_en: string;
  brandName_ar: string;
  verdictTitle_en: string;
  verdictTitle_ar: string;
  verdictSubtitle_en: string;
  verdictSubtitle_ar: string;
  // Featured Section
  featuredBadge_en: string;
  featuredBadge_ar: string;
  featuredTitle_en: string;
  featuredTitle_ar: string;
  featuredDesc_en: string;
  featuredDesc_ar: string;
  featuredProductIds: string[]; // manually selected product IDs
  // Newsletter
  newsletterTitle_en: string;
  newsletterTitle_ar: string;
  newsletterDesc_en: string;
  newsletterDesc_ar: string;
  newsletterCTA_en: string;
  newsletterCTA_ar: string;
  // Footer
  footerHeading_en: string;
  footerHeading_ar: string;
  footerDesc_en: string;
  footerDesc_ar: string;
  footerCopyright_en: string;
  footerCopyright_ar: string;
  // Loyalty Tiers
  tierPlatinumThreshold: number;
  tierGoldThreshold: number;
  shippingFee: number;
}

const defaultCMS: CMSData = {
  heroBadge_en: 'Natural & Organic',
  heroBadge_ar: 'منتجات طبيعية وحيوية',
  heroTitle_en: 'NOURISH YOUR NATURAL CURLS WITH PURE BOTANICALS',
  heroTitle_ar: 'غذّي شعرك الطبيعي بالنباتات النقية',
  heroDesc_en: 'Premium organic solutions for vibrant, healthy hair. Experience the power of nature combined with molecular science.',
  heroDesc_ar: 'حلول عضوية فاخرة لشعر حيوي وصحي. اختبر قوة الطبيعة مجتمعة مع العلم الجزيئي.',
  heroCTA1_en: 'SHOP COLLECTION',
  heroCTA1_ar: 'تسوق المجموعة',
  heroCTA2_en: 'QUICK CHECKOUT',
  heroCTA2_ar: 'شراء سريع',
  heroImg: '',
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
};

interface CMSContextType {
  data: CMSData;
  loading: boolean;
  updateData: (newData: Partial<CMSData>) => Promise<void>;
}

const CMSContext = createContext<CMSContextType>({
  data: defaultCMS,
  loading: true,
  updateData: async () => {},
});

export const useCMS = () => useContext(CMSContext);

export function CMSProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [data, setData] = useState<CMSData>(defaultCMS);
  const [loading, setLoading] = useState(true);

  const refreshCMS = useCallback(async () => {
    try {
      // Force no-cache to ensure we get the latest data from the backend
      const res = await fetchApi('/cms', { cache: 'no-store' } as any);
      if (res) {
        // Sanitize any accidentally hardcoded localhost URLs for images
        if (typeof res.heroImg === 'string') {
          res.heroImg = res.heroImg.replace(/http:\/\/localhost:5000(?:\/api)?/g, process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '');
        }
        if (typeof res.logoUrl === 'string') {
          res.logoUrl = res.logoUrl.replace(/http:\/\/localhost:5000(?:\/api)?/g, process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '');
        }
        setData({ ...defaultCMS, ...res });
      }
    } catch (err) {
      console.error('Failed to fetch CMS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCMS();
  }, [refreshCMS]);

  // Listen for real-time updates from the backend
  useEffect(() => {
    if (socket) {
      socket.on('cms_updated', (updatedData: any) => {
        console.log('CMS Updated via socket');
        // If data is passed directly, we can use it to avoid a refetch, 
        // but refetching is safer for sanitization.
        refreshCMS();
      });
      return () => {
        socket.off('cms_updated');
      };
    }
  }, [socket, refreshCMS]);

  const updateData = async (newData: Partial<CMSData>) => {
    // Sanitize on save as well
    if (typeof newData.heroImg === 'string') {
      newData.heroImg = newData.heroImg.replace(/http:\/\/localhost:5000(?:\/api)?/g, '');
    }
    if (typeof newData.logoUrl === 'string') {
      newData.logoUrl = newData.logoUrl.replace(/http:\/\/localhost:5000(?:\/api)?/g, '');
    }

    const updated = { ...data, ...newData };
    setData(updated);
    
    try {
      await fetchApi('/cms', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('CMS Sync Error:', err);
    }
  };

  return (
    <CMSContext.Provider value={{ data, loading, updateData }}>
      {children}
    </CMSContext.Provider>
  );
}
