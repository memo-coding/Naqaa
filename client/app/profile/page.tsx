'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi, getImageUrl } from '@/lib/api';
import { NotificationBell } from '@/components/NotificationBell';
import { useSocket } from '@/components/SocketProvider';
import { BrandLogo } from '@/components/BrandLogo';

export default function ProfilePage() {
  const { user, loading, logout, isAuthenticated, updateProfile } = useAuth();
  const { t, dir } = useLang();
  const router = useRouter();
  const { socket } = useSocket();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  const [subMessage, setSubMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const handleEditClick = () => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPassword('');
      setEditError('');
      setEditSuccess(false);
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess(false);
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { error } = await updateProfile(editName, editEmail, editPassword || undefined);
    
    if (error) {
      setEditError(error);
    } else {
      setEditSuccess(true);
      setTimeout(() => setIsEditing(false), 2000);
    }
    setEditLoading(false);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchApi('/orders/myorders');
        setDbOrders(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
    
    if (socket) {
      const handleOrderUpdate = (data: { orderId: string, status: string }) => {
        // Find if the order exists in our list and update it
        setDbOrders(prev => prev.map(order => 
          order.id === data.orderId ? { ...order, status: data.status } : order
        ));
      };
      
      socket.on('orderUpdate', handleOrderUpdate);
      return () => {
        socket.off('orderUpdate', handleOrderUpdate);
      };
    }
  }, [user?.id, socket]);

  const handleConfirmDelivery = async (orderId: string) => {
    if (!confirm(t('confirm_delivery_q') || 'Are you sure you have received this order?')) return;
    try {
      const data = await fetchApi(`/orders/myorders/${orderId}/confirm`, {
        method: 'PUT'
      });
      if (data) {
        // Update local state
        setDbOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered', payment_status: 'paid' } : o));
        setSelectedOrder((prev: any) => prev?.id === orderId ? { ...prev, status: 'delivered', payment_status: 'paid' } : prev);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm delivery');
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-background"><span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-xl animate-spin"></span></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20" dir={dir}>
      <main className="pt-32 max-w-4xl mx-auto px-8">
         <div className="relative mb-12">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl -z-10"></div>
            <div className={`flex flex-col md:flex-row items-center gap-8 ${dir === 'rtl' ? 'md:text-right' : 'md:text-left'}`}>
               <div className="w-32 h-32 rounded-xl border-4 border-primary/20 p-1">
                  <div className="w-full h-full rounded-xl bg-surface-container flex items-center justify-center overflow-hidden">
                     {user.avatar_url ? (
                       <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                     ) : (
                       <span className="material-symbols-outlined text-6xl text-primary">{user.role === 'admin' ? 'admin_panel_settings' : 'person'}</span>
                     )}
                  </div>
               </div>
               <div className="flex-1">
                  <h1 className="text-4xl font-black font-headline uppercase text-on-surface ">{user.name}</h1>
                  <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                     <span className="px-3 py-1 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase  border border-primary/10">
                        {user.role === 'admin' ? (dir === 'rtl' ? 'القيم على الأتيليه' : 'Atelier Curator') : 
                         (dir === 'rtl' ? `عضو ${user.loyaltyTier || 'Member'}` : `${user.loyaltyTier || 'Member'} Delegate`)}
                     </span>
                  </div>
               </div>
               <button onClick={handleEditClick} className="px-8 py-4 bg-surface-container-high hover:bg-white/5 border border-white/5 text-xs font-bold uppercase  rounded-2xl transition-all">
                  {t('profile_edit_config') || 'Edit Profile'}
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="glass-panel p-8 rounded-2xl border border-primary/10">
               <h3 className="text-xs font-black uppercase ] mb-6 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm">history</span> {t('profile_order_history') || 'Ritual History'}
               </h3>
               <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="animate-pulse flex flex-col gap-4">
                      <div className="h-16 bg-white/5 rounded-2xl w-full"></div>
                      <div className="h-16 bg-white/5 rounded-2xl w-full"></div>
                    </div>
                  ) : dbOrders.length === 0 ? (
                    <div className="text-center py-8 opacity-40">
                      <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                      <p className="text-xs font-bold uppercase ">{t('profile_no_orders') || 'No rituals recorded yet'}</p>
                    </div>
                  ) : (
                  dbOrders.slice(0, 10).map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                       <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <p className="font-bold text-sm  text-on-surface">Order #ORD-{order.id.toString().substring(0, 6).toUpperCase()}</p>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase opacity-50">
                            {order.status === 'shipped' ? (dir === 'rtl' ? 'تم الشحن' : 'Shipped') : 
                             order.status === 'delivered' ? (dir === 'rtl' ? 'تم التوصيل' : 'Delivered') : 
                             order.status === 'processing' ? (dir === 'rtl' ? 'جاري المعالجة' : 'Processing') : 
                             order.status === 'pending' ? (dir === 'rtl' ? 'قيد الانتظار' : 'Pending') : 
                             order.status} • ${order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                       </div>
                       <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all ${dir === 'rtl' ? 'rotate-180' : ''}`}>arrow_forward</span>
                    </div>
                  ))
                  )}
               </div>
               <button className="w-full mt-6 py-4 text-[10px] font-black uppercase  text-on-surface-variant hover:text-primary transition-all">
                  {t('profile_view_all_orders') || 'View All Rituals'}
               </button>
            </section>

         </div>
      </main>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-primary/20 rounded-3xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setIsEditing(false)} 
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-2xl font-black font-headline uppercase mb-6 text-primary">{t('profile_edit_config') || 'Edit Profile'}</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-left" dir={dir === 'rtl' ? 'rtl' : 'ltr'}>
              <div>
                <label className="block text-xs font-bold uppercase  text-on-surface-variant mb-2">Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase  text-on-surface-variant mb-2">Email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase  text-on-surface-variant mb-2">New Password (Optional)</label>
                <input 
                  type="password" 
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
                  placeholder="Leave blank to keep same"
                />
              </div>

              {editError && <div className="p-3 bg-error/10 text-error text-xs font-bold rounded-lg border border-error/20">{editError}</div>}
              {editSuccess && <div className="p-3 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">Profile updated successfully!</div>}

              <button 
                type="submit" 
                disabled={editLoading}
                className="w-full mt-4 py-4 bg-primary text-on-primary-container font-black text-sm uppercase  rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface-container-highest border border-primary/20 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-primary/10 flex justify-between items-start relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-xl blur-3xl -z-10"></div>
                <div>
                   <h3 className="text-3xl font-black font-headline  text-primary uppercase mb-1">Order #ORD-{selectedOrder.id.toString().substring(0, 6).toUpperCase()}</h3>
                   <p className="text-xs text-on-surface-variant/60 font-bold uppercase ">{new Date(selectedOrder.created_at).toLocaleDateString()} / Placed on {new Date(selectedOrder.created_at).getDate()}</p>
                </div>
               <button onClick={() => setShowOrderModal(false)} className="p-3 hover:bg-primary/10 rounded-xl transition-all text-on-surface-variant hover:text-primary active:scale-90 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">close</span>
               </button>
            </div>

            <div className="p-10 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-10">
               {/* Shipping & Customer */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] font-black uppercase ] text-primary mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">local_shipping</span> {dir === 'rtl' ? 'لوجستيات الشحن' : 'Shipping Logistics'}
                     </p>
                     <div className="space-y-1">
                        <p className="font-bold text-on-surface text-lg leading-tight">{selectedOrder.shipping_address}</p>
                        <p className="text-on-surface-variant text-sm font-medium">{selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                        {selectedOrder.shipping_company_name && (
                           <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20 inline-flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-primary">delivery_dining</span>
                              <span className="text-[10px] font-black uppercase  text-primary">{dir === 'rtl' ? 'شركة الشحن' : 'Courier'}: {selectedOrder.shipping_company_name}</span>
                           </div>
                        )}
                     </div>
                  </div>
                  <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                     <p className="text-[10px] font-black uppercase ] text-primary mb-4 flex items-center gap-2 justify-end">
                        {dir === 'rtl' ? 'العميل' : 'Customer'} <span className="material-symbols-outlined text-sm">person</span>
                     </p>
                     <p className="font-bold text-on-surface text-lg text-right">{selectedOrder.customer_name}</p>
                     <p className="text-on-surface-variant text-sm font-medium text-right opacity-70">{selectedOrder.customer_email}</p>
                     <p className="text-on-surface-variant text-xs font-bold text-right mt-1 ">{selectedOrder.customer_phone}</p>
                  </div>
               </div>

               {/* Payment Status Card */}
               <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10 flex items-center justify-between group flex-row-reverse">
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase ">{dir === 'rtl' ? 'طريقة الدفع' : 'Payment Method'}</p>
                        <p className="font-black text-on-surface uppercase ">
                           {selectedOrder.payment_method === 'manual' ? (dir === 'rtl' ? 'الدفع عند الاستلام' : 'Pay on Delivery') : 
                            selectedOrder.payment_method === 'wallet' ? (dir === 'rtl' ? 'محفظة رقمية' : 'Digital Wallet') : 
                            (dir === 'rtl' ? 'بطاقة ائتمان' : 'Credit Card')}
                        </p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-on-surface/5 flex items-center justify-center text-on-surface group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">
                           {selectedOrder.payment_method === 'manual' ? 'local_shipping' : 
                            selectedOrder.payment_method === 'wallet' ? 'account_balance_wallet' : 'credit_card'}
                        </span>
                     </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                     selectedOrder.payment_status === 'paid' ? 'bg-success/10 border-success/20 text-success' : 
                     selectedOrder.payment_status === 'pending' ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' :
                     'bg-error/10 border-error/20 text-error'
                  }`}>
                     <span className="material-symbols-outlined text-sm">
                       {selectedOrder.payment_status === 'paid' ? 'check_circle' : 
                        selectedOrder.payment_status === 'pending' ? 'schedule' : 'cancel'}
                     </span>
                     <span className="text-[10px] font-black uppercase ">
                        {selectedOrder.payment_status === 'paid' ? (dir === 'rtl' ? 'مدفوع ✓' : 'Paid ✓') : 
                         selectedOrder.payment_status === 'failed' ? (dir === 'rtl' ? 'فشل الدفع ✕' : 'Payment Failed ✕') :
                         selectedOrder.payment_status === 'pending' && selectedOrder.payment_method !== 'manual' ? (dir === 'rtl' ? 'بانتظار الدفع ⌛' : 'Pending Payment ⌛') :
                         (dir === 'rtl' ? 'الدفع عند الاستلام ✕' : 'Unpaid (COD) ✕')}
                     </span>
                  </div>
               </div>

               {/* Order Items */}
               <div>
                  <p className="text-[10px] font-black uppercase ] text-primary mb-6 text-center">{dir === 'rtl' ? 'أصناف العينات' : 'Constituent Specimens'}</p>
                  <div className="space-y-3">
                     {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-surface-container-highest rounded-xl overflow-hidden border border-outline-variant/10">
                                 <img src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              </div>
                              <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                 <h4 className="font-bold text-sm text-on-surface">{item.name}</h4>
                                 <p className="text-[10px] text-on-surface-variant font-medium opacity-60 uppercase">ID: {selectedOrder.id.toString().substring(0,8)}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-primary font-black text-sm">x{item.quantity}</p>
                              <p className="text-[10px] text-on-surface-variant font-bold opacity-60">@ ${(item.price || 0).toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="p-10 bg-surface-container-high/50 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-primary/10">
               {selectedOrder.status === 'shipped' && (
                 <button 
                   onClick={() => handleConfirmDelivery(selectedOrder.id)}
                   className="w-full md:w-auto px-8 py-4 bg-primary text-on-primary-container font-black text-[10px] uppercase ] rounded-2xl shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3 animate-pulse"
                 >
                   <span className="material-symbols-outlined text-sm">local_shipping</span>
                   {dir === 'rtl' ? 'تأكيد استلام الطلب' : 'Confirm Order Delivery'}
                 </button>
               )}
                <div className="text-center md:text-right w-full md:w-auto ml-auto">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase  mb-1">{dir === 'rtl' ? 'إجمالي القيمة' : 'Total Value'}</p>
                   <p className="text-4xl font-black font-headline text-on-surface ">${selectedOrder.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
