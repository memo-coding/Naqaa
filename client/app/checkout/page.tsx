'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { BrandLogo } from '@/components/BrandLogo';
import { useCMS } from '@/components/CMSProvider';
import { fetchApi } from '@/lib/api';

export default function Checkout() {
  const router = useRouter();
  const { data: cms } = useCMS();
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { t, lang, dir } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'manual'>('manual');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    address: '',
    city: '',
    country: 'SA',
    notes: '',
  });

  useEffect(() => {
    if (user && isMounted) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user, isMounted]);

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validation
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      setOrderError(t('auth_error_missing_fields') || 'Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setOrderError('');

    try {
       const data = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user?.id,
          total_amount: cartTotal,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_country: form.country,
          notes: form.notes.trim() || undefined,
          payment_method: paymentMethod,
          items: items.map(item => ({
            product_id: item.id,
            name: item.name,
            img: item.img,
            quantity: item.qty,
            price: item.price,
          })),
        })
      });
      const createdOrderId = data.id || data._id;
      setOrderId(createdOrderId);
      clearCart();

      if (paymentMethod === 'card' || paymentMethod === 'wallet') {
        const paymentData = await fetchApi('/payments/paymob/initiate', {
          method: 'POST',
          body: JSON.stringify({ orderId: createdOrderId, paymentMethod })
        });
        
        if (paymentData && paymentData.iframeUrl) {
          window.location.href = paymentData.iframeUrl;
          return;
        }
      }

      setIsSuccess(true);
    } catch (error: any) {
      setOrderError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6 selection:bg-primary/30 transition-colors duration-500" dir={dir}>
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-secondary blur-3xl rounded-xl opacity-20 animate-pulse"></div>
            <span className="material-symbols-outlined text-[120px] text-secondary drop-shadow-[0_0_20px_var(--accent-glow)]">task_alt</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">{t('checkout_success_title')}</h1>
            <p className="text-on-surface-variant font-body text-lg leading-relaxed">{t('checkout_success_desc')}</p>
            {orderId && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                 <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Order Identifier</p>
                 <p className="font-mono text-lg font-black text-on-surface tracking-tighter">#ORD-{orderId.toString().substring(0, 6).toUpperCase()}</p>
              </div>
            )}
          </div>
          <div className="pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/track-order?id=${orderId}`} className="flex-1 block py-4 bg-primary text-on-primary-container text-center font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] transition-all active:scale-95">
                {t('track_cta') || 'TRACK ORDER'}
              </Link>
              <Link href="/" className="flex-1 block py-4 bg-secondary text-on-primary-container text-center font-black text-sm uppercase tracking-[0.2em] rounded-xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] transition-all active:scale-95">
                {t('checkout_return')}
              </Link>
            </div>
            <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-[0.3em] font-bold leading-relaxed">{t('checkout_confirmation')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen transition-colors duration-500" dir={dir}>

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto relative">
        {/* Static Back Button (Top Right of Container as requested) */}
        <div className={`flex ${dir === 'rtl' ? 'justify-start' : 'justify-end'} mb-10`}>
          <button 
            onClick={() => router.back()}
            className="w-14 h-14 bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-primary/20 hover:scale-110 active:scale-95 transition-all text-on-surface group shadow-xl"
            title={t('back_to_cart') || 'Go Back'}
          >
            <span className={`material-symbols-outlined text-2xl group-hover:text-primary transition-colors ${dir === 'rtl' ? 'rotate-180' : ''}`}>
              arrow_back
            </span>
          </button>
        </div>
        {isProcessing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-xl animate-spin mx-auto shadow-[0_0_20px_var(--accent-glow)]"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary animate-pulse">{t('checkout_processing')}</p>
            </div>
          </div>
        )}
        <header className="mb-16">
          <h1 className="text-5xl md:text-6xl font-black font-headline tracking-tighter text-on-surface mb-4 uppercase">{t('checkout_secure')}</h1>
          <p className="text-on-surface-variant font-body max-w-2xl text-lg leading-relaxed">{t('checkout_desc')}</p>
          
          {orderError && (
            <div className="mt-8 p-4 bg-error/10 border border-error/30 rounded-2xl flex items-center gap-4 text-error animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="material-symbols-outlined shrink-0">warning</span>
              <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">{orderError}</p>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Order Summary */}
          <section className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/15 shadow-2xl">
              <h2 className="font-headline text-2xl font-black text-primary mb-8 tracking-tight uppercase">{t('checkout_summary')}</h2>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {items.length === 0 ? (
                    <div className="py-10 text-center opacity-30 uppercase font-black tracking-widest text-xs">{t('cart_empty')}</div>
                ) : items.map((item) => (
                  <div key={item.id} className="glass-panel rounded-2xl overflow-hidden p-4 flex gap-6 border border-outline-variant/15 group">
                    <div className="w-20 h-20 bg-surface-container-highest rounded-xl flex-shrink-0 overflow-hidden border border-outline-variant/10 shadow-lg">
                      <img alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={item.img}/>
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-headline font-black text-on-surface text-sm uppercase tracking-tight">{item.name}</h3>
                        <p className="text-primary font-black text-[10px] uppercase tracking-widest mt-1">{(item.category || 'Specimen').toUpperCase()}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">{t('cart_quantity_p')}: {item.qty}</span>
                        <span className="text-secondary font-black text-lg neon-glow">${(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 space-y-4 border-t border-outline-variant/30 pt-8">
                <div className="flex justify-between text-on-surface-variant text-sm font-bold uppercase tracking-widest">
                  <span>{t('checkout_subtotal')}</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                  <span>{t('checkout_shipping')}</span>
                  <span className="text-secondary font-black text-sm">$0</span>
                </div>
                {/* Automatic Deduction Notice */}
                {/* Automatic Deduction Notice - Hidden temporarily as requested */}
                {/* <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-tight text-primary">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <p>
                    {lang === 'ar' 
                      ? 'سيتم خصم رسوم الشحن تلقائياً عند الدفع بالمحفظة أو الكارت' 
                      : 'Shipping fees are automatically deducted for Card/Wallet payments'}
                  </p>
                </div> */}
                <div className="flex justify-between items-center text-on-surface pt-6">
                  <span className="font-headline text-xl font-black uppercase tracking-tighter">{t('checkout_total')}</span>
                  <span className="font-headline text-4xl font-black text-primary neon-glow tracking-tighter">${cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Promotional Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-4 transition-all hover:bg-primary/10">
              <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>eco</span>
              <div>
                <p className="text-on-surface font-black uppercase tracking-tight text-sm">{t('checkout_promise_title')}</p>
                <p className="text-on-surface-variant text-xs font-medium leading-relaxed mt-1">{t('checkout_promise_desc')}</p>
              </div>
            </div>
          </section>

          {/* Right Column: Shipping and Payment Forms */}
          <section className="lg:col-span-7">
            <div className="space-y-12">
              
              {/* Shipping Section */}
              <div className="bg-surface-container rounded-3xl p-10 border border-outline-variant/10 shadow-xl">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black shadow-lg">1</span>
                  <h2 className="font-headline text-2xl font-black uppercase tracking-tight">{t('checkout_shipping_info')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex flex-col gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ${lang === 'ar' ? 'mr-1' : 'ml-1'}`}>{t('checkout_full_name')}</label>
                    <input required value={form.name} onChange={e => updateForm('name', e.target.value)} className={`bg-surface-container-high border-b-2 border-outline-variant/20 rounded-xl p-4 text-on-surface outline-none focus:border-primary focus:bg-primary/5 transition-all font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`} placeholder="Julian V. Botanist" type="text"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ${lang === 'ar' ? 'mr-1' : 'ml-1'}`}>{t('checkout_email')}</label>
                    <input required value={form.email} onChange={e => updateForm('email', e.target.value)} className={`bg-surface-container-high border-b-2 border-outline-variant/20 rounded-xl p-4 text-on-surface outline-none focus:border-primary focus:bg-primary/5 transition-all font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`} placeholder="julian@verdantlocks.com" type="email"/>
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ${lang === 'ar' ? 'mr-1' : 'ml-1'}`}>{t('checkout_phone') || 'Phone Number'}</label>
                    <input required value={form.phone} onChange={e => updateForm('phone', e.target.value)} className={`bg-surface-container-high border-b-2 border-outline-variant/20 rounded-xl p-4 text-on-surface outline-none focus:border-primary focus:bg-primary/5 transition-all font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`} placeholder="+966 50 000 0000" type="tel"/>
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ${lang === 'ar' ? 'mr-1' : 'ml-1'}`}>{t('checkout_city')}</label>
                    <input required value={form.city} onChange={e => updateForm('city', e.target.value)} className={`bg-surface-container-high border-b-2 border-outline-variant/20 rounded-xl p-4 text-on-surface outline-none focus:border-primary focus:bg-primary/5 transition-all font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`} placeholder="Amazonia" type="text"/>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ${lang === 'ar' ? 'mr-1' : 'ml-1'}`}>{t('checkout_address')}</label>
                    <input required value={form.address} onChange={e => updateForm('address', e.target.value)} className={`bg-surface-container-high border-b-2 border-outline-variant/20 rounded-xl p-4 text-on-surface outline-none focus:border-primary focus:bg-primary/5 transition-all font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`} placeholder="123 Fern Avenue, Greenhouse District" type="text"/>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-surface-container rounded-3xl p-10 border border-outline-variant/10 shadow-xl">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black shadow-lg">2</span>
                  <h2 className="font-headline text-2xl font-black uppercase tracking-tight">{t('checkout_payment_method')}</h2>
                </div>
                
                <div className="flex gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                  {/* <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 min-w-[120px] bg-surface-container-highest border-2 rounded-2xl p-6 flex flex-col items-center gap-3 group transition-all ${paymentMethod === 'card' ? 'border-primary/50 bg-primary/5' : 'border-transparent hover:border-primary/20'}`}>
                    <span className={`material-symbols-outlined text-4xl transition-colors ${paymentMethod === 'card' ? 'text-primary shadow-sm drop-shadow-[0_0_10px_rgba(47,248,1,0.2)]' : 'text-on-surface-variant group-hover:text-primary'}`}>credit_card</span>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${paymentMethod === 'card' ? 'text-primary' : 'text-on-surface-variant'}`}>{t('checkout_credit_card') || 'Credit Card'}</span>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('wallet')} className={`flex-1 min-w-[120px] bg-surface-container-highest border-2 rounded-2xl p-6 flex flex-col items-center gap-3 group transition-all ${paymentMethod === 'wallet' ? 'border-primary/50 bg-primary/5' : 'border-transparent hover:border-primary/20'}`}>
                    <span className={`material-symbols-outlined text-4xl transition-colors ${paymentMethod === 'wallet' ? 'text-primary shadow-sm drop-shadow-[0_0_10px_rgba(47,248,1,0.2)]' : 'text-on-surface-variant group-hover:text-primary'}`}>account_balance_wallet</span>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${paymentMethod === 'wallet' ? 'text-primary' : 'text-on-surface-variant'}`}>{t('checkout_digital_wallet') || 'Digital Wallet'}</span>
                  </button> */}
                  <button type="button" onClick={() => setPaymentMethod('manual')} className={`flex-1 min-w-[120px] bg-surface-container-highest border-2 rounded-2xl p-6 flex flex-col items-center gap-3 group transition-all ${paymentMethod === 'manual' ? 'border-primary/50 bg-primary/5' : 'border-transparent hover:border-primary/20'}`}>
                    <span className={`material-symbols-outlined text-4xl transition-colors ${paymentMethod === 'manual' ? 'text-primary shadow-sm drop-shadow-[0_0_10px_rgba(47,248,1,0.2)]' : 'text-on-surface-variant group-hover:text-primary'}`}>payments</span>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${paymentMethod === 'manual' ? 'text-primary' : 'text-on-surface-variant'}`}>{t('checkout_manual_payment') || 'Manual Payment'}</span>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-6 py-8 animate-in fade-in slide-in-from-bottom-2 bg-primary/5 rounded-3xl p-8 border border-primary/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
                    <div className="w-16 h-16 shrink-0 bg-primary/20 text-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(47,248,1,0.2)]">
                      <span className="material-symbols-outlined text-4xl">credit_card</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black font-headline uppercase tracking-tighter mb-2 text-on-surface leading-none">{t('checkout_credit_card') || 'Credit Card'}</h4>
                      <p className="text-xs font-bold text-on-surface-variant leading-relaxed tracking-wide">
                        {t('payment_redirect_card')}
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="space-y-6 py-8 animate-in fade-in slide-in-from-bottom-2 bg-primary/5 rounded-3xl p-8 border border-primary/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
                    <div className="w-16 h-16 shrink-0 bg-primary/20 text-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(47,248,1,0.2)]">
                      <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black font-headline uppercase tracking-tighter mb-2 text-on-surface leading-none">{t('checkout_digital_wallet') || 'Digital Wallet'}</h4>
                      <p className="text-xs font-bold text-on-surface-variant leading-relaxed tracking-wide">
                        {t('payment_redirect_wallet')}
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'manual' && (
                  <div className="space-y-6 py-8 animate-in fade-in slide-in-from-bottom-2 bg-primary/5 rounded-3xl p-8 border border-primary/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start">
                    <div className="w-16 h-16 shrink-0 bg-primary/20 text-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(47,248,1,0.2)]">
                      <span className="material-symbols-outlined text-4xl">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black font-headline uppercase tracking-tighter mb-2 text-on-surface leading-none">{t('checkout_pay_on_delivery') || 'Pay on Delivery'}</h4>
                      <p className="text-xs font-bold text-on-surface-variant leading-relaxed tracking-wide">
                        {t('checkout_pay_on_delivery_desc') || 'Please prepare the exact amount upon delivery. The courier is equipped for both cash and card payments.'}
                      </p>
                    </div>
                  </div>
                )}

                {orderError && (
                  <div className="mb-6 px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                    {orderError}
                  </div>
                )}
                <button 
                  onClick={handlePurchase}
                  disabled={isProcessing || items.length === 0}
                  className="w-full mt-12 bg-secondary text-on-primary-container font-headline font-black py-6 rounded-2xl uppercase tracking-[0.3em] text-sm shadow-[0_0_40px_var(--accent-glow)] hover:shadow-[0_0_60px_var(--accent-glow)] transition-all active:scale-[0.98] duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                >
                  {isProcessing ? t('checkout_processing') : t('checkout_complete')}
                </button>
                <p className="text-center text-on-surface-variant text-[10px] mt-8 font-black uppercase tracking-widest leading-relaxed">
                  <span className="material-symbols-outlined align-middle text-sm mr-2 text-primary">verified_user</span>
                  {t('checkout_security')}
                </p>
              </div>

            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-primary/10 bg-surface-container-low transition-colors duration-500">
        <div className="p-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto px-8 py-16">
            <div className="space-y-6">
              <BrandLogo className="mx-auto" />
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">{t('footer_desc')}</p>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase tracking-widest">{t('footer_nav')}</h5>
              <ul className="space-y-2">
                <li><Link className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="/shop">{t('footer_shop_all')}</Link></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_specimen_map')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_science')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_sustainability')}</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase tracking-widest">{t('footer_connect')}</h5>
              <ul className="space-y-2">
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Instagram</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">TikTok</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-on-surface font-bold font-headline text-sm uppercase tracking-widest">{t('footer_legal')}</h5>
              <ul className="space-y-2">
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_privacy')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_terms')}</a></li>
                <li><a className="font-body text-sm text-on-surface-variant hover:text-primary transition-all inline-block" href="#">{t('footer_shipping')}</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-8 border-t border-primary/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">{t('footer_copyright')}</p>
            <div className="flex gap-6">
              <span className="text-[8px] text-on-surface-variant/30 font-black uppercase tracking-[0.3em]">Carbon Neutral Site</span>
              <span className="text-[8px] text-on-surface-variant/30 font-black uppercase tracking-[0.3em]">Powered by Bio-Grid</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
