'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useLang } from '@/components/LanguageProvider';
import { useWishlist } from '@/components/WishlistProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SideCart } from '@/components/SideCart';
import { useAuth } from '@/components/AuthProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useState, useEffect } from 'react';
import { fetchApi, getImageUrl } from '@/lib/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, setIsCartOpen, cartCount } = useCart();
  const { toggleWishlist, isInWishlist, wishlist, removeFromWishlist, setIsWishlistOpen } = useWishlist();
  const { t, lang, dir, toggleLang } = useLang();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (id) {
      fetchApi(`/products/${id}`).then((prodRes) => {
        setProduct(prodRes);
        return fetchApi(`/reviews/${id}`);
      }).then((revRes) => {
        setReviews(revRes || []);
        setLoading(false);
      }).catch((err) => {
        console.error(err);
        setProduct(null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black font-headline text-on-surface uppercase">404: SPECIMEN LOST</h1>
          <Link href="/shop" className="text-primary font-bold hover:underline">Return to Collective Catalog</Link>
        </div>
      </div>
    );
  }

  const name = lang === 'ar' ? product.name_ar : product.name;
  const description = (lang === 'ar' ? product.description_ar : product.description) || '';
  const category = lang === 'ar' ? (product.categories as any)?.name_ar : (product.categories as any)?.name;

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0';

  const submitReview = async () => {
    if (!isAuthenticated) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
       const newReview = await fetchApi(`/reviews/${id}`, {
          method: 'POST',
          body: JSON.stringify({ rating, comment })
       });
       setReviews([newReview, ...reviews]);
       setShowReviewForm(false);
       setComment('');
       setRating(5);
    } catch (error: any) {
       setReviewError(error.message || 'Error submitting review');
    } finally {
       setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen transition-colors duration-500 overflow-x-hidden" dir={dir}>
      <main className="pt-32 pb-40 max-w-7xl mx-auto px-8 relative">
        {/* Static Back Button (Top Right of Container as requested) */}
        <div className={`flex ${dir === 'rtl' ? 'justify-start' : 'justify-end'} mb-10`}>
          <button 
            onClick={() => router.back()}
            className="w-14 h-14 bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary/20 hover:scale-110 active:scale-95 transition-all text-on-surface group shadow-xl"
            title={t('back_to_shop') || 'Go Back'}
          >
            <span className={`material-symbols-outlined text-2xl group-hover:text-primary transition-colors ${dir === 'rtl' ? 'rotate-180' : ''}`}>
              arrow_back
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Image Section */}
          <div className="relative group lg:sticky lg:top-32">
            <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl bg-surface-container">
              <img src={getImageUrl(product.img)} alt={name} className="w-full h-[700px] object-cover" />
            </div>
            {product.rarity && (
              <div className={`absolute top-8 ${dir === 'rtl' ? 'right-8' : 'left-8'} px-4 py-2 bg-background/80 backdrop-blur-md border border-primary/30 rounded-full text-[10px] font-black uppercase ] text-primary`}>
                {product.rarity.toUpperCase()} SPECIMEN
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className={`space-y-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <span className="text-secondary font-black uppercase ] text-[10px]">{category}</span>
                 <div className="h-px flex-1 bg-white/5"></div>
                 <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm font-fill">star</span>
                    <span className="text-[10px] font-black">{averageRating}</span>
                    <span className="text-[10px] text-on-surface-variant opacity-40">({reviews.length})</span>
                 </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-headline uppercase leading-tight ">{name}</h1>
              <div className="flex items-baseline gap-4">
                 <p className="text-primary font-black text-4xl">${product.price.toFixed(2)}</p>
                 <span className="text-[10px] font-black uppercase  text-on-surface-variant opacity-30 line-through">${(product.price * 1.5).toFixed(0)}</span>
              </div>
            </div>

            <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl font-light">
              {description}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => addToCart({ id: product.id, name: product.name, price: Number(product.price), img: product.img ?? '', category: (product.categories as any)?.name }, 1)}
                className="flex-1 lg:flex-none px-12 py-5 bg-gradient-to-br from-primary to-primary-container text-[#002a06] font-black uppercase ] rounded-xl shadow-[0_0_40px_rgba(145,247,142,0.15)] hover:scale-105 active:scale-95 transition-all text-xs"
              >
                {t('add_to_cart')}
              </button>
              <button 
                onClick={() => toggleWishlist({ id: product.id, name: product.name, price: Number(product.price), img: product.img ?? '' })}
                className={`p-5 border border-primary/20 rounded-xl transition-all ${isInWishlist(product.id) ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "" }}>favorite</span>
              </button>
            </div>

            {/* Quality Badges - Dynamic from Product Data */}
            <div className="flex flex-wrap gap-x-12 gap-y-6 py-8 border-y border-white/5">
               <div className="flex items-center gap-3">
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] font-black uppercase ] leading-none text-primary">
                       {lang === 'ar' ? product.scientific_name_ar : product.scientific_name_en || 'SCIENTIFIC'}
                     </p>
                     <p className="text-[8px] text-on-surface-variant uppercase mt-1 font-bold">
                       {lang === 'ar' ? product.scientific_desc_ar : product.scientific_desc_en || 'CLINICALLY TESTED'}
                     </p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-3xl font-light">science</span>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] font-black uppercase ] leading-none text-secondary">
                       {lang === 'ar' ? product.organic_name_ar : product.organic_name_en || 'ORGANIC'}
                     </p>
                     <p className="text-[8px] text-on-surface-variant uppercase mt-1 font-bold">
                       {lang === 'ar' ? product.organic_desc_ar : product.organic_desc_en || 'SUSTAINABLY SOURCED'}
                     </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-3xl font-light">eco</span>
               </div>
            </div>

            {/* Key Ingredients Section */}
            {(lang === 'ar' ? product.key_ingredients_ar : product.key_ingredients_en) && (
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black uppercase ] text-primary">
                      {lang === 'ar' ? 'المكونات الرئيسية' : 'Key Ingredients'}
                    </h3>
                    <div className="h-px flex-1 bg-primary/20"></div>
                 </div>
                 <div className="bg-surface-container-low/50 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                    <p className="text-sm text-on-surface-variant leading-relaxed font-light whitespace-pre-wrap">
                      {lang === 'ar' ? product.key_ingredients_ar : product.key_ingredients_en}
                    </p>
                 </div>
              </div>
            )}

            {/* Benefits section (Existing) */}
            {((lang === 'ar' ? product.benefits_ar : product.benefits) || []).length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-xs font-black uppercase ] text-on-surface-variant/40">{t('product_ingredients_title') || 'Active Benefits'}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {((lang === 'ar' ? product.benefits_ar : product.benefits) || []).map((benefit: string, i: number) => (
                     <div key={i} className="p-5 bg-surface-container rounded-3xl border border-white/5">
                       <p className="text-xs font-black uppercase  text-on-surface">{benefit}</p>
                       <p className="text-[9px] text-on-surface-variant uppercase  mt-1 opacity-60">Verified Specimen Property</p>
                     </div>
                   ))}
                 </div>
              </div>
            )}

               {/* REVIEWS SECTION */}
               <div className="space-y-8 pt-12 border-t border-white/5">
                  <div className="flex justify-between items-end">
                     <div>
                        <h3 className="text-xs font-black uppercase ] text-secondary mb-2">{t('reviews_title') || 'Patient Trials & Reviews'}</h3>
                        <div className="flex items-center gap-3">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`material-symbols-outlined text-sm ${star <= Number(averageRating) ? 'text-primary' : 'text-on-surface-variant opacity-20'}`}>star</span>
                              ))}
                           </div>
                           <span className="text-lg font-black italic  font-headline">{averageRating} / 5.0</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => {
                           if (!isAuthenticated) {
                              router.push('/login');
                           } else {
                              setShowReviewForm(!showReviewForm);
                           }
                        }}
                        className="text-[9px] font-black uppercase  text-primary border-b border-primary/20 pb-1 hover:text-white transition-colors">
                        {t('product_write_review') || 'Leave a Review'}
                     </button>
                  </div>

                  {showReviewForm && (
                     <div className="p-6 bg-surface-container rounded-[2rem] border border-primary/30 space-y-4">
                        <div className="flex gap-2 mb-2 cursor-pointer">
                           {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                 key={star} 
                                 onClick={() => setRating(star)}
                                 className={`material-symbols-outlined text-xl ${star <= rating ? 'text-primary' : 'text-on-surface-variant opacity-20 hover:opacity-50'}`}>
                                 star
                              </span>
                           ))}
                        </div>
                        <textarea 
                           className="w-full bg-[#0a0f0b] border border-white/10 rounded-2xl p-4 text-sm font-medium text-white outline-none focus:border-primary/50 transition-colors"
                           rows={3}
                           placeholder="Share your experience with this specimen..."
                           value={comment}
                           onChange={(e) => setComment(e.target.value)}
                        />
                        {reviewError && <p className="text-red-500 text-xs italic">{reviewError}</p>}
                        <div className="flex justify-end gap-3 mt-4">
                           <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-xs font-bold uppercase  text-on-surface-variant hover:text-white transition-colors">Cancel</button>
                           <button onClick={submitReview} disabled={submittingReview || !comment.trim()} className="px-6 py-2 bg-primary text-background rounded-full text-xs font-black uppercase  hover:bg-secondary transition-colors disabled:opacity-50">
                              {submittingReview ? 'Submitting...' : 'Submit Post'}
                           </button>
                        </div>
                     </div>
                  )}

                  <div className="space-y-6">
                    {reviews.map((rev: any) => (
                      <div key={rev._id || rev.id} className="p-8 bg-surface-container/40 rounded-[2.5rem] border border-white/5 space-y-4 transition-all hover:bg-surface-container/60 group">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <img src={rev.author_img ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmbY6KbVHXJIM2xtpUv36K0oSwYuA79IFrF5RRNxVhH0DBio88yS6KynheUec3ClrWr5EwmNP4ooVctPmCeyceCbM7BWvyY0yZzGVbR9vf4eq73yfr9w9-TVWTnWybXr6eNtTkK9A_fccZieogfbgz-LR1UEwA6fUBHAu601jzBSGqRWVoIWiEsQNvxdRb7ZyOUrP5oFbXgW424nF5_5qUTqCsl01du28FJ7EMDti4uY_7o4Pins-lROKMvHxX1ECMtDqVxOZVyuRT'} className="w-10 h-10 rounded-full border border-primary/20 p-0.5 object-cover" alt="Avatar" />
                               <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                  <p className="text-xs font-black uppercase  text-white">{rev.author_name}</p>
                                  <p className="text-[8px] text-on-surface-variant uppercase ">
                                     {!isNaN(new Date(rev.createdAt || rev.created_at).getTime()) 
                                        ? new Date(rev.createdAt || rev.created_at).toLocaleDateString() 
                                        : new Date().toLocaleDateString()}
                                  </p>
                               </div>
                            </div>
                            <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <span key={star} className={`material-symbols-outlined text-[10px] ${star <= rev.rating ? 'text-secondary' : 'text-white/5'}`}>star</span>
                               ))}
                            </div>
                         </div>
                         <p className="text-sm font-medium leading-relaxed text-on-surface-variant italic">"{rev.comment}"</p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-10 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-4">forum</span>
                        <p className="text-[10px] font-black uppercase ">{t('reviews_empty') || 'No reviews yet for this specimen.'}</p>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>
       </main>
    </div>
  );
}
