'use client';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCart } from '@/components/CartProvider';
import { useLang } from '@/components/LanguageProvider';
import { SideCart } from '@/components/SideCart';
import { useAuth } from '@/components/AuthProvider';
import { NotificationBell } from '@/components/NotificationBell';
import { useCMS } from '@/components/CMSProvider';
import { useWishlist } from '@/components/WishlistProvider';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, getImageUrl } from '@/lib/api';
export type DBProduct = any;

export default function Home() {
  const router = useRouter();
  const { cartCount, setIsCartOpen, addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlist, removeFromWishlist, setIsWishlistOpen } = useWishlist();
  const { lang, t, toggleLang, dir } = useLang();
  const { isAuthenticated, user } = useAuth();
  const { data: cms } = useCMS();

  const [searchQuery, setSearchQuery] = useState('');

  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('admin@naqaa.com');

  useEffect(() => {
    fetchApi('/auth/admin-email')
      .then(data => {
        if (data && data.email) setAdminEmail(data.email);
      }).catch(err => console.error(err));

    fetchApi('/products')
      .then((data) => {
        if (!data) { setDbLoading(false); return; }
        const active = data.filter((p: any) => p.is_active);
        // If admin picked specific products in CMS, honour that order
        const ids = cms.featuredProductIds;
        if (ids && ids.length > 0) {
          const picked = ids
            .map((id: string) => active.find((p: any) => String(p.id) === String(id)))
            .filter(Boolean)
            .slice(0, 3);
          setDbProducts(picked.length > 0 ? picked : active.slice(0, 3));
        } else {
          setDbProducts(active.slice(0, 3));
        }
        setDbLoading(false);
      })
      .catch((err) => {
        console.error('Failure fetching products:', err);
        setDbLoading(false);
      });
  }, [cms.featuredProductIds]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) { 
      router.push(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen transition-colors duration-500 overflow-x-hidden" dir={dir}>
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden px-8 pt-32 pb-16 transition-all">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-xl blur-[120px]"></div>
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/5 rounded-xl blur-[150px]"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className={`space-y-12 order-2 lg:order-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-container-high border border-primary/20 text-primary text-[9px] font-black uppercase ] font-label">
                <span className="w-1.5 h-1.5 rounded-xl bg-secondary animate-pulse shadow-[0_0_10px_var(--accent-glow)]"></span>
                {lang === 'ar' ? cms.heroBadge_ar : cms.heroBadge_en}
              </div>
              <h1 className="text-3xl md:text-6xl font-black font-headline  leading-[1.3] md:leading-[1.4] text-on-surface uppercase whitespace-pre-line">
                {lang === 'ar' ? cms.heroTitle_ar : cms.heroTitle_en}
              </h1>
              <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed opacity-80">
                {lang === 'ar' ? cms.heroDesc_ar : cms.heroDesc_en}
              </p>
              <div className="flex flex-wrap gap-6 pt-6 justify-start">
                <Link href="/shop" className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold rounded-xl shadow-[0_0_40px_var(--accent-glow)] hover:shadow-[0_0_60px_var(--accent-glow)] transition-all active:scale-95">
                  {lang === 'ar' ? cms.heroCTA1_ar : cms.heroCTA1_en}
                </Link>
                <Link href="/checkout" className="px-8 py-4 bg-surface-variant/20 backdrop-blur-md border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/10 transition-all active:scale-95">
                  {lang === 'ar' ? cms.heroCTA2_ar : cms.heroCTA2_en}
                </Link>
              </div>
            </div>

            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="relative rounded-2xl overflow-hidden border-2 border-secondary/40 bg-black">
                  {cms.heroImg && <img alt="Naqaa Hero" className="w-full max-w-md h-[600px] object-cover" src={cms.heroImg} />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Specimens Section */}
        <section className="py-24 max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
            <div className={`space-y-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <span className="text-secondary font-bold font-label  uppercase text-xs">{lang === 'ar' ? cms.featuredBadge_ar : cms.featuredBadge_en}</span>
              <h2 className="text-4xl md:text-5xl font-black font-headline uppercase">{lang === 'ar' ? cms.featuredTitle_ar : cms.featuredTitle_en}</h2>
            </div>
            <p className={`text-on-surface-variant max-w-xs text-sm leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {lang === 'ar' ? cms.featuredDesc_ar : cms.featuredDesc_en}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dbLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="group relative">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container border border-white/5 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 space-y-3">
                      <div className="h-2 w-16 bg-white/10 rounded-xl"></div>
                      <div className="h-6 w-36 bg-white/10 rounded-xl"></div>
                      <div className="h-8 w-24 bg-white/5 rounded-xl mt-4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
            dbProducts.map((item) => (
              <div key={item.id} className="group relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-container border border-white/5 transition-all duration-700 group-hover:scale-[1.02] shadow-2xl">
                  <img src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                  <div className={`absolute top-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} flex flex-col gap-2`}>
                    <button
                      onClick={() => toggleWishlist({ id: item.id, name: item.name, price: item.price, img: item.img ?? '' })}
                      className={`w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-primary/20 ${isInWishlist(item.id) ? 'text-primary' : 'text-white'}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(item.id) ? "'FILL' 1" : "" }}>favorite</span>
                    </button>
                    <Link
                      href={`/product/${item.id}`}
                      className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-primary/20 text-white">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </div>

                  <div className={`absolute bottom-8 ${dir === 'rtl' ? 'right-8 text-right' : 'left-8 text-left'} right-8`}>
                    <p className="text-[10px] font-black uppercase  text-primary mb-1">{lang === 'ar' ? (item.categories as any)?.name_ar : (item.categories as any)?.name}</p>
                    <h3 className="text-2xl font-headline font-black uppercase  mb-4">{lang === 'ar' ? item.name_ar : item.name}</h3>
                    <button 
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, img: item.img ?? '', category: (item.categories as any)?.name }, 1)}
                      className="w-full px-6 py-3 bg-primary text-[#002a06] rounded-xl text-[10px] font-black uppercase  hover:scale-[1.05] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(145,247,142,0.3)]">
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      {t('add_to_cart')}
                    </button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-surface-container-low overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 relative">
            <div className={`mb-0 ${dir === 'rtl' ? 'text-right' : 'text-center'}`}>
              <h2 className="text-5xl md:text-7xl font-black font-headline uppercase ">
                {lang === 'ar' ? cms.verdictTitle_ar : cms.verdictTitle_en}
              </h2>
              <p className="text-primary mt-4 font-black uppercase ] text-[10px] opacity-60">
                {lang === 'ar' ? cms.verdictSubtitle_ar : cms.verdictSubtitle_en}
              </p>
            </div>

            <TestimonialSlider testimonials={[
              { author: t('testimonial_1_author'), role: t('testimonial_1_role'), text: t('testimonial_1'), color: 'primary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmbY6KbVHXJIM2xtpUv36K0oSwYuA79IFrF5RRNxVhH0DBio88yS6KynheUec3ClrWr5EwmNP4ooVctPmCeyceCbM7BWvyY0yZzGVbR9vf4eq73yfr9w9-TVWTnWybXr6eNtTkK9A_fccZieogfbgz-LR1UEwA6fUBHAu601jzBSGqRWVoIWiEsQNvxdRb7ZyOUrP5oFbXgW424nF5_5qUTqCsl01du28FJ7EMDti4uY_7o4Pins-lROKMvHxX1ECMtDqVxOZVyuRT' },
              { author: t('testimonial_2_author'), role: t('testimonial_2_role'), text: t('testimonial_2'), color: 'secondary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7UAgNgMyQ-cdajZzGPllxIpZ3kBwXl8uUFdtDywlWckypPIQrmm2GwHD80Z2EJgU57e6r5YbCmMScti4aVfJ9B5g2lhl_i0mCL9l3lMm3dCDrF0quqbhqAk0jnEu36fbOnxuLkjkjOetLi8Ti4sEi9vXd8VZLsSBJoFPCcapgOpD4_LVIutzPGmmTYy-vGvJad-r404NWXSbEaonWrgmIeKuscqHL8dXSQsh4f-l3cUXZfWsoxCFQ65OsF8saKd21zUPbp67vPKxe' },
              { author: t('testimonial_3_author'), role: t('testimonial_3_role'), text: t('testimonial_3'), color: 'primary', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZd7a3fmIMffVjZom6DDEgSpntkMQcemE1a29MGuPc6w--eiQAW_sqjQ9E7-nYW1GfuYQE2uoHXmpJNoDcmejVI6LcmInehkqdSe7_gW08ruznelHFbnNJcs1GKvg51sQ5Q0JqmdfXyvROJb11OksM0CLx9Y-1oOY59BsSHJ8ctuImpg6VRSV3Q59E7YMEZvUCxUU4mw9RNXnNre3mvw06r7X8X4FfGYcvE4wbwAhNsL6lgPCljAbk16WH2sxJAE-eFdlMvKpuAv1l' }
            ]} />
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-24 px-8">
          <div className="max-w-5xl mx-auto glass-panel rounded-2xl p-12 md:p-20 overflow-hidden relative border-secondary/20">
            <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center`}>
              <div className={`${dir === 'rtl' ? 'text-right flex-1' : 'text-left'}`}>
                <h2 className="text-4xl md:text-5xl font-black font-headline  leading-tight uppercase">
                  {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                </h2>
                <p className="mt-6 text-on-surface-variant text-lg leading-relaxed">
                  {lang === 'ar' ? 'نحن هنا للإجابة على جميع استفساراتك. أرسل لنا رسالتك وسنقوم بالرد عليك في أقرب وقت عبر البريد الإلكتروني.' : 'We are here to answer all your inquiries. Send us a message and we will get back to you as soon as possible.'}
                </p>
              </div>
              <form 
                className={`space-y-4 flex flex-col ${dir === 'rtl' ? 'flex-1' : ''}`} 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const message = formData.get('message') as string;
                  const body = encodeURIComponent(message);
                  window.location.href = `mailto:${adminEmail}?subject=Contact%20Query&body=${body}`;
                }}
              >
                <textarea 
                  name="message"
                  required
                  className={`w-full bg-surface-container-highest border border-primary/20 focus:border-primary px-4 py-4 rounded-xl text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none min-h-[120px] resize-y ${dir === 'rtl' ? 'text-right' : 'text-left'}`} 
                  placeholder={lang === 'ar' ? 'اكتب رسالتك أو استفسارك هنا...' : 'Type your message or inquiry here...'} 
                />
                <button type="submit" className="w-full py-5 bg-secondary text-on-primary-container font-black uppercase  rounded-xl shadow-[0_0_30px_var(--accent-glow)] hover:scale-[1.02] transition-all text-sm">
                  {lang === 'ar' ? 'إرسال الرسالة عبر البريد' : 'Send via Email'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-primary/10 bg-surface-container-low transition-colors duration-500 py-16 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
            <BrandLogo className="mb-4" />
            <p className="font-body text-xs text-on-surface-variant max-w-sm uppercase  leading-loose">
               {lang === 'ar' ? cms.footerDesc_ar : cms.footerDesc_en}
            </p>
          </div>
          <p className="font-body text-[10px] font-bold uppercase ] text-on-surface-variant/40">
             {lang === 'ar' ? cms.footerCopyright_ar : cms.footerCopyright_en}
          </p>
        </div>
      </footer>
    </div>
  );
}
