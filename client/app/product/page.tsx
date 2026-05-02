'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCart } from '@/components/CartProvider';
import { useLang } from '@/components/LanguageProvider';
import { SideCart } from '@/components/SideCart';
import { BrandLogo } from '@/components/BrandLogo';

export default function Product() {
  const { addToCart, cartCount, setIsCartOpen } = useCart();
  const { lang, t, toggleLang, dir } = useLang();
  const [quantity, setQuantity] = useState(1);

  const product = {
    id: 99,
    name: t('product_title_1') + ' ' + t('product_title_2'),
    price: 42,
    category: 'Exotics',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQH1vEVXCvIV43qtMiOao6H3sUgpHjuSQi2ac9bmWRAjGcf1n8LggAC3zs9u-CRemSWs0DMmvAS22ZcsIMPeetn60Eo--WUtzZE8bgwButqulVLC6TVfIfPxxytd3mSVzqABdKozB7SNfjKWaZ6sgzzP9iBHQpdJhL_TCY4TsidjlH0DQMoj4EKFXv3ENMTHHu6xML-mCECtMmQKU2oaRKhecOA0gDMmFTFXEk7uc5lEH5Txf7eO9lCd0auqJ1ct5eFBQgzQNctbqc'
  };

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen relative overflow-x-hidden transition-colors duration-500" dir={dir}>
      <SideCart />

      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-primary/10 transition-colors duration-500" style={{ background: 'var(--nav-bg)' }}>
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <BrandLogo />
          <div className="hidden md:flex items-center gap-12 font-headline font-bold uppercase ] text-[10px]">
            <Link className="text-on-surface-variant hover:text-primary transition-colors" href="/shop">{t('nav_catalog')}</Link>
            <Link className="text-primary" href="/product">{t('nav_highlight')}</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors" href="/admin">{t('nav_admin')}</Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="text-[10px] font-black uppercase  px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all">
              {t('nav_language')}
            </button>
            <ThemeToggle />
            <button 
              onClick={() => setIsCartOpen(true)}
              className="text-primary hover:bg-primary/5 transition-all duration-300 p-2 rounded-xl relative"
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-on-primary-container text-[10px] font-black rounded-xl flex items-center justify-center shadow-[0_0_10px_var(--accent-glow)]">
                {cartCount}
              </span>
            </button>
            <button className="text-primary hover:bg-primary/5 transition-all duration-300 p-2 rounded-xl">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-container-low border border-outline-variant/20 shadow-2xl">
              <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" src={product.img}/>
              <div className={`absolute bottom-6 ${lang === 'ar' ? 'right-6' : 'left-6'} flex gap-2`}>
                <span className="px-3 py-1 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-xs font-bold rounded-xl uppercase ">{t('product_new_release')}</span>
                <span className="px-3 py-1 bg-secondary/20 backdrop-blur-md border border-secondary/30 text-secondary text-xs font-bold rounded-xl uppercase ">{t('product_synthetic_organic')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-on-surface leading-[0.9]  uppercase font-headline">
                {t('product_title_1')} <br/>
                <span className="text-primary">{t('product_title_2')}</span>
              </h1>
              <p className="text-3xl font-black text-secondary  neon-glow">${product.price.toFixed(2)}</p>
            </div>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
              {t('product_desc')}
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-surface-container rounded-xl border border-outline-variant/30 px-2 py-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="px-6 font-bold text-lg min-w-[3rem] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <span className="text-[10px] uppercase  text-on-surface-variant font-bold">{t('product_batch')}</span>
              </div>
              <button 
                onClick={() => addToCart(product, quantity)}
                className="w-full md:w-auto px-12 py-5 bg-secondary text-on-primary-container font-black text-lg rounded-2xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] active:scale-95 transition-all flex items-center justify-center gap-3 group uppercase "
              >
                {t('product_cta')}
                <span className={`material-symbols-outlined transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180' : ''}`}>add_shopping_cart</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-outline-variant/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">eco</span>
                <span className="text-xs font-black uppercase ">{t('product_vegan')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">science</span>
                <span className="text-xs font-black uppercase ">{t('product_lab')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Details Section */}
        <section className="bg-surface-container-low py-24 transition-colors">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-black  mb-16 flex items-center gap-4 uppercase font-headline">
              <span className={`w-12 h-[1px] ${lang === 'ar' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-primary to-transparent`}></span>
              {t('product_science_title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Key Ingredients */}
              <div className="glass-panel p-10 rounded-3xl border border-outline-variant/10 hover:border-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary mb-6">biotech</span>
                <h3 className="text-xl font-black mb-6 uppercase  font-headline">{t('product_ingredients_title')}</h3>
                <ul className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex flex-col">
                      <span className="text-on-surface font-black text-sm uppercase ">{t(`product_ingredient_${i}_name`)}</span>
                      <span className="text-sm text-on-surface-variant leading-relaxed mt-1">{t(`product_ingredient_${i}_desc`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* How to Use */}
              <div className="glass-panel p-10 rounded-3xl border border-outline-variant/10 hover:border-primary/20 transition-all">
                <span className="material-symbols-outlined text-4xl text-primary mb-6">auto_awesome</span>
                <h3 className="text-xl font-black mb-6 uppercase  font-headline">{t('product_usage_title')}</h3>
                <div className="space-y-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <span className="text-3xl font-black text-primary/20">0{i}</span>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{t(`product_usage_${i}`)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="glass-panel p-10 rounded-3xl border-secondary/10 hover:border-secondary/30 transition-all">
                <span className="material-symbols-outlined text-4xl text-secondary mb-6">verified</span>
                <h3 className="text-xl font-black mb-6 uppercase  font-headline">{t('product_benefits_title')}</h3>
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-secondary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>
                        {i === 1 ? 'bolt' : i === 2 ? 'water_drop' : i === 3 ? 'flare' : 'shield'}
                      </span>
                      <span className="text-[10px] font-black uppercase ">{t(`product_benefit_${i}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-4xl font-black  mb-4 uppercase font-headline">{t('product_reviews_title')}</h2>
              <div className="flex items-center gap-4">
                <div className="flex text-secondary neon-glow scale-125 mx-2">
                  {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>star</span>)}
                </div>
                <span className="font-black text-lg">4.9/5.0</span>
                <span className="text-on-surface-variant text-[10px] font-bold uppercase  ml-2">{t('product_reviews_count')}</span>
              </div>
            </div>
            <button className="px-8 py-4 bg-surface-container border border-outline-variant/30 text-[10px] font-black uppercase ] hover:bg-primary hover:text-on-primary-container hover:border-primary transition-all rounded-xl active:scale-95 shadow-lg">
              {t('product_write_review')}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="p-10 bg-surface-container rounded-[2rem] border border-outline-variant/10 hover:border-primary/20 transition-all relative">
                <div className={`absolute -top-4 ${lang === 'ar' ? 'left-6' : 'right-6'}`}>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase  rounded-lg border border-primary/20">{t('confirmed_specimen')}</span>
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <p className="font-black font-headline text-lg uppercase ">"{i === 1 ? t('testimonial_1').slice(0, 30) : t('testimonial_3').slice(0, 30)}..."</p>
                    <div className="flex text-secondary mt-2">
                      {[1,2,3,4,5].map(j => <span key={j} className="material-symbols-outlined text-xs" style={{fontVariationSettings: "'FILL' 1"}}>star</span>)}
                    </div>
                  </div>
                </div>
                <p className="text-on-surface-variant leading-relaxed text-sm mb-8">{i === 1 ? t('testimonial_1') : t('testimonial_3')}</p>
                <p className="text-[10px] font-black text-primary uppercase ]">— {i === 1 ? t('testimonial_1_author') : t('testimonial_3_author')}, {i === 1 ? t('testimonial_1_role') : t('testimonial_3_role')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products */}
        <section className="max-w-7xl mx-auto px-6 py-24 pb-40">
          <h2 className="text-3xl font-black  mb-16 uppercase font-headline">{t('product_ritual_title')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { id: 10, name: 'Stem Cell Synthetics', price: 68, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcY2u6RCeIUDvASeXK1IXnU7-pqmZTgwHHLkqHaTLHZSoK8gMc21E5M39vsD-6-kIUi0WH6g1JqAUrEYHZOSkkGr0t_NU9pW9kPuOSzKllrccnuUq9KIba9QeqiARsHRcCM8V-0Ue1Eew48kmJ7s5t03nFER2OYUQl0w-UJPIx1PtyFUviEjHLAMJ1AhWPR-2CAKyoxy5SDTid_yIQg6Wp0l8rFRAeVORw8S9D8ypePJnOo6hSyprdQ-mm6m-K8uhpxXdzLiIX-Pt2' },
              { id: 11, name: 'The Root Elixirs', price: 54, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM1r9mYJTLoVRlCjhbGQLlKnGrUp5JgFuS_8BnCFCa45nmpnSTY8tNI8LJFmekSLWYqTsDrHAoGAtktAoDb2Jjk7ZCYo3iA7xWAJ5HhdcEu-CGeMltegIyuqTmYe_LLmfCrHoErUfsJYffxVd1Bkd4irXoGczJcW_amw461QHZcbwfy8W9TENDODkBNkWyz34BeuxYS5aEpJf7OkvO7xJofaAy_U0_2NR1dR-Dn4A7MmT-Dbag2EbmdceanG-TPowu1_qBSRHE6GuI' },
              { id: 12, name: 'Foliage Wash', price: 38, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALeM9j7VZOOY0P-tnIauhnX8FbUv6shFSnihW6YHkqIoEeG1GI0wdwhRVhf1OE__KxLraV1R48Odj8EGfwmvWyUMt89EULD0nF1pReSBmHM1QtXXermV_1ptj5pz_iAE-XP8BDsmFImcvGhAPC9pO0si2wgQoaBOgIsGWt1kWFCMGXIex2vZ040aQwO0Ty6PhNTT-8Ex3uuqwxh13QstI9ZfkehnmeU0dgPfqOimYq1X_fagziK1l2OzT8jJrayTQo6Ho_xi7fygYU' },
              { id: 13, name: 'Verdant Mask', price: 52, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIdvBGJTDeKQyXWF9AqDajha1Sjef7cIcBk7KuF0dc5OQSCBDVZ1s402VYM9mtE5wYXSwiiW4YOjPW9yEqgE74He_RSXjUqb0JGFEumjclNMp9iGCWM1gPDVdUADYHJgrJA6ErIp_JYeiRm9gxaFOSXBYpQL3Ysbr8c2MY0B98UIp4p7vwAOY2NocQv2eK8smei9h3plo7W1MC1ZbXnUrRo4UDxT4vNkHhJTD3RDCkBmp6AVxlwqdBxbp6LQoJT2Euu35O8s3dawVw' }
            ].map(item => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container mb-6 border border-outline-variant/10 group-hover:border-primary/40 transition-all duration-700 shadow-xl">
                  <img alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" src={item.img}/>
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({...item, category: 'Ritual'}); }}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl hover:bg-primary hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <h3 className="font-black font-headline text-sm  mb-1 group-hover:text-primary transition-colors uppercase">{item.name}</h3>
                <p className="text-secondary font-black text-sm neon-glow">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-primary/10 bg-surface-container-low transition-colors duration-500">
        <div className="p-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto px-8 py-16">
            <div className="space-y-6">
              <BrandLogo />
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">{t('footer_desc')}</p>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_nav')}</h5>
              <ul className="space-y-2">
                <li><Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="/shop">{t('footer_shop_all')}</Link></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_specimen_map')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_science')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_sustainability')}</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_connect')}</h5>
              <ul className="space-y-2">
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Instagram</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">TikTok</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase ">{t('footer_legal')}</h5>
              <ul className="space-y-2">
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_privacy')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_terms')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_shipping')}</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-8 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-[10px] font-bold uppercase  text-on-surface-variant/40">{t('footer_copyright')}</p>
            <div className="flex gap-6">
              <span className="text-[8px] text-on-surface-variant/30 font-black uppercase ]">Carbon Neutral Site</span>
              <span className="text-[8px] text-on-surface-variant/30 font-black uppercase ]">Powered by Bio-Grid</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
