'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useLang } from './LanguageProvider';

export function SideCart() {
  const { items, removeFromCart, updateQty, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { t, lang, dir } = useLang();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end" dir={dir}>
      <div 
        className="absolute inset-0 backdrop-blur-sm transition-opacity" 
        style={{ background: 'var(--overlay-bg)' }} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      <div className={`w-full max-w-md h-full bg-background border-outline-variant/30 shadow-2xl relative z-10 p-10 flex flex-col animate-in ${lang === 'ar' ? 'slide-in-from-left border-r' : 'slide-in-from-right border-l'} duration-500`}>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-black font-headline  uppercase italic">{t('cart_title')}</h2>
          <button onClick={() => setIsCartOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
          {items.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4 text-outline-variant">inventory_2</span>
              <p className="font-headline font-black uppercase  text-sm">{t('cart_empty')}</p>
              <p className="text-[10px] mt-2 uppercase ">{t('cart_empty_desc')}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-20 bg-surface-container rounded-xl overflow-hidden shadow-lg shrink-0 border border-outline-variant/10">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-headline font-black uppercase text-sm leading-tight max-w-[150px]">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="material-symbols-outlined text-xs text-on-surface-variant hover:text-error transition-colors">delete</button>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant">{item.category ? t(`filter_${item.category.toLowerCase().replace(' ', '_')}`) : ''}</p>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-xs font-black text-primary">${(item.price * item.qty).toLocaleString()}</span>
                    <div className="flex items-center gap-3 bg-surface-container px-2 py-1 rounded-lg border border-outline-variant/30">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="material-symbols-outlined text-xs hover:text-primary transition-colors">remove</button>
                      <span className="text-[10px] font-bold min-w-[20px] text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="material-symbols-outlined text-xs hover:text-primary transition-colors">add</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-10 border-t border-outline-variant/30 mt-auto">
          <div className="flex justify-between mb-6">
            <span className="text-[10px] font-black uppercase  text-on-surface-variant">{t('cart_estimated')}</span>
            <span className="text-xl font-black neon-glow text-primary">${cartTotal.toLocaleString()}</span>
          </div>
          <Link 
            href="/checkout" 
            onClick={() => setIsCartOpen(false)} 
            className={`w-full block py-5 bg-secondary text-on-primary-container text-center font-black text-sm uppercase ] rounded-2xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] transition-all ${items.length === 0 ? 'pointer-events-none grayscale opacity-50' : 'active:scale-[0.98]'}`}
          >
            {t('cart_checkout')}
          </Link>
        </div>
      </div>
    </div>
  );
}
