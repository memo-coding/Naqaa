'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useWishlist } from '@/components/WishlistProvider';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';

export type DBProduct = any;

const ITEMS_PER_PAGE = 6;

export default function Shop() {
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { lang, t, dir } = useLang();
  const { isAuthenticated } = useAuth();

  // Live data from Supabase/Mongo
  const [allProducts, setAllProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDbLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          fetchApi('/products'),
          fetchApi('/categories')
        ]);
        
        const activeProducts = productsData ? productsData.filter((p: any) => p.is_active) : [];
        setAllProducts(activeProducts);
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('Failure fetching shop data:', err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Price Range State - Null by default as requested
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const maxAvailablePrice = allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price)) : 200;

  const [sortBy, setSortBy] = useState('Default');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category Filter
    if (activeCategory !== 'All') {
      result = result.filter(p => (p.categories as any)?.name === activeCategory);
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.name_ar.includes(q) ||
        (p.categories as any)?.name?.toLowerCase().includes(q)
      );
    }

    // Price Range Filter
    if (minPrice !== null) result = result.filter(p => p.price >= minPrice);
    if (maxPrice !== null) result = result.filter(p => p.price <= maxPrice);

    // Sorting
    if (sortBy === 'Price: Low → High') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price: High → Low') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'Name A → Z') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [allProducts, searchQuery, activeCategory, minPrice, maxPrice, sortBy]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, minPrice, maxPrice, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen transition-colors duration-500 overflow-x-hidden" dir={dir}>
      <main className="pt-32 pb-40 max-w-7xl mx-auto px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className={`space-y-6 max-w-2xl ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <span className="text-secondary font-black font-label tracking-[0.4em] uppercase text-[10px] opacity-60 underline underline-offset-8 decoration-primary/30">{t('shop_badge')}</span>
            <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter leading-[1.1] uppercase">
              {t('shop_title_1')}<br/>
              <span className="text-primary">{t('shop_title_2')}</span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed">{t('shop_desc')}</p>
          </div>
          <div className="flex-1 w-full lg:max-w-md flex gap-4 items-center">
             <div className="relative group flex-1">
                <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-all duration-300`}>search</span>
                <input 
                  className={`w-full bg-surface-container-high border border-outline-variant/20 focus:border-primary/40 rounded-xl ${dir === 'rtl' ? 'pr-14' : 'pl-14'} py-6 text-sm outline-none transition-all placeholder:text-on-surface-variant/30 font-bold shadow-xl`} 
                  placeholder={t('search_placeholder')} 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <button 
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden w-16 h-16 bg-primary text-[#002a06] rounded-xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-2xl">filter_list</span>
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 relative items-start">
          {/* Sidebar Filter */}
          <aside className={`lg:sticky lg:top-32 h-fit space-y-12 lg:self-start lg:block ${isFilterOpen ? 'fixed inset-y-0 left-0 z-[150] w-80 bg-surface-container p-10 overflow-y-auto animate-in slide-in-from-left duration-300 shadow-2xl' : 'hidden'}`}>
            <div className="lg:hidden flex justify-between items-center mb-10">
              <BrandLogo />
              <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-xl"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/50">{t('filter_nav')}</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setActiveCategory('All'); setIsFilterOpen(false); }}
                  className={`text-[11px] font-black uppercase tracking-0.1em text-left px-5 py-4 rounded-xl transition-all duration-300 border ${activeCategory === 'All' ? 'bg-primary text-[#002a06] border-primary shadow-lg scale-1.02' : 'bg-transparent border-white/5 text-on-surface-variant hover:bg-white/5 hover:border-white/10'}`}
                >
                  {t('filter_all') || 'All'}
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat._id}
                    onClick={() => { setActiveCategory(cat.name); setIsFilterOpen(false); }}
                    className={`text-[11px] font-black uppercase tracking-0.1em text-left px-5 py-4 rounded-xl transition-all duration-300 border ${activeCategory === cat.name ? 'bg-primary text-[#002a06] border-primary shadow-lg scale-1.02' : 'bg-transparent border-white/5 text-on-surface-variant hover:bg-white/5 hover:border-white/10'}`}
                  >
                    {lang === 'ar' ? cat.name_ar : cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/50">{t('price_range')}</h3>
                <button 
                  onClick={() => { setMinPrice(null); setMaxPrice(null); }}
                  className="text-[9px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors underline underline-offset-4 decoration-primary/20"
                >Reset</button>
              </div>
              
              <div className="space-y-6 pt-2">
                <div className="relative h-6 flex items-center px-1">
                  <input 
                    type="range"
                    min="0"
                    max={maxAvailablePrice}
                    value={maxPrice ?? maxAvailablePrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full appearance-none h-1.5 bg-surface-container-highest rounded-xl outline-none cursor-pointer range-slider"
                  />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                   <div className="flex-1 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">Min</p>
                      <div className="bg-surface-container-high border border-white/5 rounded-xl px-5 py-4 flex items-center group-focus-within:border-primary/30 transition-all shadow-lg">
                         <span className="text-[10px] font-bold opacity-30 mr-6 select-none">$</span>
                         <input 
                          type="number"
                          value={minPrice ?? ''}
                          onChange={(e) => setMinPrice(e.target.value === '' ? null : Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="bg-transparent text-[11px] font-black w-full outline-none appearance-none hide-spinners flex-1 relative z-20"
                          placeholder="0"
                         />
                      </div>
                   </div>
                   <div className="w-4 h-px bg-white/10 mt-6"></div>
                   <div className="flex-1 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">Max</p>
                      <div className="bg-surface-container-high border border-white/5 rounded-xl px-5 py-4 flex items-center relative transition-all focus-within:border-primary/40 shadow-lg">
                         <span className="text-[10px] font-bold opacity-30 mr-6 select-none">$</span>
                         <input 
                          type="number"
                          value={maxPrice ?? ''}
                          onChange={(e) => setMaxPrice(e.target.value === '' ? null : Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="bg-transparent text-[11px] font-black w-full outline-none appearance-none hide-spinners flex-1 relative z-20"
                          placeholder={maxAvailablePrice.toString()}
                         />
                      </div>
                   </div>
                </div>
              </div>

              <style jsx>{`
                .hide-spinners::-webkit-inner-spin-button,
                .hide-spinners::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                .hide-spinners {
                  -moz-appearance: textfield;
                }
                .range-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 20px;
                  width: 20px;
                  border-radius: 50%;
                  background: var(--primary);
                  box-shadow: 0 0 15px var(--accent-glow), 0 0 30px var(--accent-glow);
                  cursor: pointer;
                  border: 3px solid #002a06;
                  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .range-slider::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                }
                .range-slider::-moz-range-thumb {
                   height: 20px;
                   width: 20px;
                   border-radius: 50%;
                   background: var(--primary);
                   box-shadow: 0 0 15px var(--accent-glow);
                   cursor: pointer;
                   border: 3px solid #002a06;
                }
              `}</style>
            </div>

            <div className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/50">{t('sort_by')}</h3>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/20 px-5 py-5 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary/40 shadow-xl transition-all cursor-pointer"
              >
                <option value="Default">{t('sort_default')}</option>
                <option value="Price: Low → High">{t('sort_price_low')}</option>
                <option value="Price: High → Low">{t('sort_price_high')}</option>
                <option value="Name A → Z">{t('sort_name')}</option>
              </select>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-12 text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40">
               <span className="flex items-center gap-2">
                 <span className={`w-1.5 h-1.5 rounded-xl ${dbLoading ? 'bg-yellow-400' : 'bg-primary'} animate-pulse`}></span>
                 {dbLoading ? 'Loading...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? (t('specimen_found') || 'Specimen') : (t('specimens_found') || 'Specimens')}`}
               </span>
               {!dbLoading && (filteredProducts.length !== allProducts.length || minPrice !== null || maxPrice !== null) && (
                 <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); setMinPrice(null); setMaxPrice(null); }} className="text-primary hover:underline hover:text-white transition-all decoration-primary/30 underline-offset-4">{t('clear_filters') || 'Clear All'}</button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mb-20">
              {dbLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="group relative">
                    <div className="relative aspect-[4/5] rounded-2xl bg-surface-container border border-white/5 overflow-hidden animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/80 to-transparent" />
                      <div className="absolute bottom-10 left-10 space-y-3">
                        <div className="h-2 w-16 bg-white/10 rounded-xl"></div>
                        <div className="h-6 w-36 bg-white/10 rounded-xl"></div>
                        <div className="h-8 w-24 bg-white/5 rounded-xl mt-4"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                paginatedProducts.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-surface-container border border-white/5 transition-all duration-700 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.5)] shadow-2xl">
                      {/* Product Image */}
                      <img 
                        src={item.img ?? ''} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110" 
                      />
                      
                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-700" />
                      
                      {/* Top Action Buttons (Overlaid Top-Left as in Image) */}
                      <div className={`absolute top-6 ${dir === 'rtl' ? 'right-6' : 'left-6'} flex flex-col gap-3 z-30 opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 transition-all duration-500`}>
                         <button 
                           onClick={() => toggleWishlist({ id: item.id, name: item.name, price: item.price, img: item.img ?? '' })}
                           className={`w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-primary/40 hover:scale-110 active:scale-95 ${isInWishlist(item.id) ? 'text-primary' : 'text-white'}`}
                         >
                           <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isInWishlist(item.id) ? "'FILL' 1" : "" }}>favorite</span>
                         </button>
                         <Link 
                           href={`/product/${item.id}`}
                           className="w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:bg-secondary/40 hover:scale-110 active:scale-95 text-white"
                         >
                           <span className="material-symbols-outlined text-xl">visibility</span>
                         </Link>
                      </div>

                      {/* Centered Content at Bottom (Matching Image) */}
                      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-center gap-6 px-4 z-20">
                         <h3 className="text-2xl font-black uppercase tracking-tighter text-white text-center drop-shadow-2xl leading-tight">
                           {lang === 'ar' ? item.name_ar : item.name}
                         </h3>
                         
                         {/* Large Neon Green Add to Cart Button (Centerpiece from Image) */}
                         <button 
                           onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, img: item.img ?? '', category: (item.categories as any)?.name }, 1)}
                           className="w-full max-w-[200px] flex items-center justify-center gap-3 py-4 bg-[#91f78e] hover:bg-[#a8faa3] text-black rounded-2xl shadow-[0_0_30px_rgba(145,247,142,0.3)] transition-all hover:scale-105 active:scale-95 group/btn overflow-hidden relative"
                         >
                            <span className="text-[11px] font-black uppercase tracking-widest relative z-10">{t('add_to_cart')}</span>
                            <span className="material-symbols-outlined text-xl relative z-10">add_shopping_cart</span>
                            {/* Inner Glow/Pulse Effect */}
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                         </button>
                      </div>

                      {/* Subtle Price Tag (Optional extra to keep utility) */}
                      <div className={`absolute top-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} bg-secondary/10 backdrop-blur-md border border-secondary/20 px-3 py-1.5 rounded-xl`}>
                        <p className="text-[10px] font-black text-secondary tracking-tighter">${Number(item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 pt-12 border-t border-white/5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-14 h-14 rounded-xl border border-white/10 bg-surface-container/30 flex items-center justify-center disabled:opacity-30 hover:bg-primary/10 transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[20px]">{dir === 'rtl' ? 'chevron_right' : 'chevron_left'}</span>
                </button>
                
                <div className="flex gap-3">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all ${currentPage === i+1 ? 'bg-primary text-[#002a06] shadow-xl scale-110' : 'bg-surface-container/30 border border-white/5 hover:bg-white/10 opacity-60 hover:opacity-100 hover:scale-105'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-14 h-14 rounded-xl border border-white/10 bg-surface-container/30 flex items-center justify-center disabled:opacity-30 hover:bg-primary/10 transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[20px]">{dir === 'rtl' ? 'chevron_left' : 'chevron_right'}</span>
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && !dbLoading && (
              <div className="py-40 text-center space-y-6 opacity-40">
                <div className="inline-flex w-24 h-24 bg-surface-container rounded-2xl items-center justify-center border border-white/5 mb-4">
                  <span className="material-symbols-outlined text-5xl">nest_multi_room</span>
                </div>
                <p className="text-2xl font-black font-headline uppercase tracking-tighter">{t('no_match_title')}</p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); setMinPrice(null); setMaxPrice(null); }}
                  className="px-10 py-4 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-white transition-all"
                >
                  {t('reset_all')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
