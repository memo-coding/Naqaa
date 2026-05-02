'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/components/AuthProvider';
import { fetchApi } from '@/lib/api';
import { useSocket } from '@/components/SocketProvider';
import { BrandLogo } from '@/components/BrandLogo';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<null | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t, lang, dir, toggleLang } = useLang();
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order') || params.get('id');
    if (id) {
      setOrderId(id);
    }
  }, []);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId) return;
    
    setIsLoading(!timeline); // Only show spinner on first load
    setErrorMsg('');
    
    try {
      const data = await fetchApi(`/orders/track/${orderId}`);
      if (data && data.status) {
         setStatus(data.status);
         setTimeline({
           id: data.id,
           created_at: data.created_at,
           expected_delivery: data.expected_delivery
         });
      }
    } catch (error: any) {
      setErrorMsg(error.message || t('error_order_not_found') || 'Order identification not found in network.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (socket && orderId) {
       const handleOrderUpdate = (data: { orderId: string }) => {
         if (data.orderId === orderId) {
           handleTrack(); // Refresh the data
         }
       };
       socket.on('orderUpdate', handleOrderUpdate);
       return () => {
         socket.off('orderUpdate', handleOrderUpdate);
       };
    }
  }, [socket, orderId]);

  return (
    <div className="relative w-full min-h-screen bg-[#030804] text-on-surface font-body overflow-x-hidden transition-colors duration-500" dir={dir}>
      {/* Heavy atmosphere */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-xl blur-[200px] -z-10"></div>
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/10 rounded-xl blur-[150px] -z-10"></div>

      <main className="pt-40 max-w-2xl mx-auto px-8">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase ] text-secondary">{t('track_status_label') || 'RITUAL LOGISTICS'}</span>
          <h1 className="text-5xl md:text-7xl font-black font-headline uppercase ">{t('nav_track') || 'Track Ritual'}</h1>
          <p className="text-sm text-on-surface-variant font-medium max-w-md mx-auto leading-relaxed">
            {t('track_desc') || 'Enter your order identification (#ORD-XXXXXX) to locate your shipment in the botanical network.'}
          </p>
        </div>

        <form onSubmit={handleTrack} className="glass-panel p-2 rounded-3xl border border-primary/20 flex gap-2 relative">
          <input 
            type="text" 
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className={`flex-1 bg-transparent border-none ${dir === 'rtl' ? 'pr-8 pl-4' : 'pl-8 pr-4'} py-5 text-sm font-black  outline-none placeholder:text-on-surface-variant/30 uppercase`}
            placeholder={t('track_placeholder') || 'ORD-XXXXXX'}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-primary text-on-primary-container font-black uppercase  rounded-2xl shadow-[0_0_30px_var(--accent-glow)] hover:shadow-[0_0_50px_var(--accent-glow)] transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? <span className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-xl animate-spin inline-block"></span> : (t('track_cta') || 'LOCATE')}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-6 text-center animate-in fade-in zoom-in duration-300">
            <p className="text-error font-bold uppercase  text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">error</span> {errorMsg}
            </p>
          </div>
        )}

        {status && (
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="glass-panel p-10 rounded-[2.5rem] border-secondary/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-xl blur-3xl"></div>
               <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/5 pb-8 mb-8">
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] font-black uppercase ] text-secondary opacity-80 mb-1">{t('track_id_label') || 'Identification'}</p>
                     <h3 className="text-xl font-black font-headline uppercase ">
                       #ORD-{ (timeline?.id || orderId).toString().toUpperCase().replace('ORD-', '').replace('#', '').trim().substring(0, 6) }
                     </h3>
                  </div>
                  <div className="px-6 py-3 bg-secondary/10 border border-secondary/20 rounded-xl text-[10px] font-black uppercase  text-secondary shadow-[0_0_20px_rgba(47,248,1,0.2)]">
                     {t(`status_${status}`) || status.toUpperCase()}
                  </div>
               </div>

               <div className="space-y-12 relative px-4">
                  {/* Progress Line */}
                  <div className={`absolute top-0 ${dir === 'rtl' ? 'right-5.5' : 'left-5.5'} bottom-0 w-1 bg-gradient-to-b from-secondary to-white/5 rounded-xl h-[calc(100%-1.5rem)]`}></div>
                  
                  {[
                    { label: t('status_delivered') || 'Delivered', date: timeline?.expected_delivery ? new Date(timeline.expected_delivery).toLocaleDateString() : 'Expected tomorrow', icon: 'check_circle', active: status === 'delivered' },
                    { label: t('status_shipped') || 'Shipped', date: ['shipped', 'delivered'].includes(status) ? new Date().toLocaleDateString() : '--', icon: 'local_shipping', active: ['shipped', 'delivered'].includes(status) },
                    { label: t('status_processing') || 'Stabilizing Enzymes', date: timeline?.created_at ? new Date(timeline.created_at).toLocaleDateString() : '--', icon: 'biotech', active: ['processing', 'shipped', 'delivered'].includes(status) },
                    { label: t('status_pending') || 'Order Received', date: timeline?.created_at ? new Date(timeline.created_at).toLocaleDateString() : '--', icon: 'inventory', active: true },
                  ].map((step, i) => (
                    <div key={i} className={`flex gap-8 items-start relative ${step.active ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                       <div className={`w-4 h-4 rounded-xl z-10 ${step.active ? 'bg-secondary shadow-[0_0_15px_var(--accent-glow)]' : 'bg-white/10 border border-white/10'} mt-1`}></div>
                       <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <h4 className="text-sm font-black uppercase ">{step.label}</h4>
                          <p className="text-[10px] font-bold mt-1 ">{step.date}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-secondary/30 transition-all transition-transform hover:scale-[1.01]">
                  <div className="w-12 h-12 bg-surface-container-high rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-2"><span className="material-symbols-outlined text-secondary">explore</span></div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black uppercase ] text-secondary mb-1">Current Node</p>
                     <p className="text-xs font-bold leading-tight uppercase">Biolab Hub 04 - Sector C7 <br/><span className="text-[10px] opacity-40 font-medium  uppercase">Atmospheric stabilization required for transit</span></p>
                  </div>
               </div>
            </div>
          </div>
        )}
        <div className="mt-20 text-center pb-20">
           <Link href="/shop" className="text-[10px] font-black uppercase ] text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-2 transition-transform">arrow_back</span>
              Return to Collective Catalog
           </Link>
        </div>
      </main>
    </div>
  );
}
