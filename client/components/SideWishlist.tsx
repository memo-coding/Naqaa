'use client';
import { useWishlist } from '@/components/WishlistProvider';
import { useLang } from '@/components/LanguageProvider';
import Link from 'next/link';
import { getImageUrl } from '@/lib/api';

export function SideWishlist() {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, clearWishlist } = useWishlist();
  const { t, dir, lang } = useLang();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/40" 
        onClick={() => setIsWishlistOpen(false)}
      ></div>
      <div className={`w-full max-w-sm h-full bg-background border-outline-variant/30 shadow-2xl relative z-10 p-10 flex flex-col animate-in ${dir === 'rtl' ? 'slide-in-from-left' : 'slide-in-from-right'} duration-500`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black font-headline  uppercase italic">{t('wishlist_title') || 'Wishlist'}</h2>
          <div className="flex items-center gap-4">
            {wishlist.length > 0 && (
              <button 
                onClick={clearWishlist}
                className="text-[10px] font-black uppercase  text-on-surface-variant hover:text-error transition-all p-2 bg-surface-container rounded-xl border border-white/5 hover:border-error/20"
              >
                {lang === 'ar' ? 'مسح الكل' : 'Remove All'}
              </button>
            )}
            <button onClick={() => setIsWishlistOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {wishlist.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <span className="material-symbols-outlined text-5xl mb-4 text-primary opacity-20">favorite</span>
              <p className="text-[10px] font-black uppercase ">{t('wishlist_empty') || 'Your list is empty'}</p>
            </div>
          ) : (
            wishlist.map(item => (
              <div key={item.id} className="flex gap-4 group items-center">
                <div className="w-16 h-16 bg-surface-container rounded-lg overflow-hidden border border-white/5">
                  <img src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <Link href={`/product/${item.id}`} onClick={() => setIsWishlistOpen(false)} className="font-headline font-black uppercase text-[10px] hover:text-primary transition-colors block">{item.name}</Link>
                  <p className="text-[10px] font-bold text-primary mt-1">${Number(item.price).toLocaleString()}</p>
                </div>
                <button onClick={() => removeFromWishlist(item.id)} className="material-symbols-outlined text-xs text-on-surface-variant hover:text-error transition-colors">close</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
