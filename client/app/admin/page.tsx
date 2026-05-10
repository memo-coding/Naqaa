'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi, getImageUrl } from '@/lib/api';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function Dashboard() {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { t, dir } = useLang();

  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, customers: 0, recentCustomers: [] as any[], internalNotes: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'details' | 'status' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Infer payment method from legacy notes for old orders
  const inferPaymentMethod = (o: any): string => {
    if (o.payment_method) return o.payment_method;
    if (o.notes && o.notes.includes('[Payment Method: manual]')) return 'manual';
    if (o.notes && o.notes.includes('[Payment Method: wallet]')) return 'wallet';
    if (o.notes && o.notes.includes('[Payment Method: card]')) return 'card';
    return 'card';
  };
  const inferPaymentStatus = (o: any): string => {
    if (o.payment_status) return o.payment_status;
    return inferPaymentMethod(o) === 'manual' ? 'unpaid' : 'pending';
  };

  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMenuId && loadingProgress < 100) {
      interval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + Math.random() * 30, 100));
      }, 300);
    } else if (!activeMenuId) {
      setLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [activeMenuId, loadingProgress]);

  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true);
      try {
        const metrics = await fetchApi('/analytics/dashboard');
        if (metrics) {
           setStats({ 
             revenue: metrics.revenue || 0, 
             pending: metrics.activeOrders || 0, 
             customers: metrics.totalCustomers || 0,
             recentCustomers: metrics.recentCustomers || [],
             internalNotes: metrics.internalNotes || []
           });
        }
        
        const recentOrders = await fetchApi('/orders');
        if (recentOrders && Array.isArray(recentOrders)) {
           setOrders(recentOrders.map((o: any) => ({
             id: o.id,
             raw: { ...o, payment_method: inferPaymentMethod(o), payment_status: inferPaymentStatus(o) },
             name: o.items?.[0]?.name || `Order #${o.id.toString().substring(0, 6)}`,
             client: o.customer_name,
             price: `$${o.total_amount.toFixed(2)}`,
             status: o.status,
             statusKey: `status_${o.status.toLowerCase()}`,
             img: getImageUrl(o.items?.[0]?.img) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNBMxHvWdlMpfgp9l8A0EyIP2RQN9mGvVh2_c0NhpH8REYGT8Zykv4p6CGkkeK_dCnaB6NzP3ELi7MifKfwa342tZRmrkR6Z0LMJVuGH5gVfH083-lFs-HPlP3K6xtDjRHvUP35GOPb5E_mIaPXSl-oxdwQCSLstA9iDvf5klqYhcBvmq5uH5pL1WN0Yw-YYAkPU6qJX1gTfAfaS5_keqa_c-QlNxzvxeCY4IyWtFhqdASsaYSa-o_vlTdd-goO52ZIvs1FNN9pX78'
          })));
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      }
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await fetchApi(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      // Trigger a re-fetch or manual state update
      const metrics = await fetchApi('/analytics/dashboard');
      if (metrics) {
         setStats({ 
           revenue: metrics.revenue || 0, 
           pending: metrics.activeOrders || 0, 
           customers: metrics.totalCustomers || 0,
           recentCustomers: metrics.recentCustomers || [],
           internalNotes: metrics.internalNotes || []
         });
      }
      const recentOrders = await fetchApi('/orders');
      if (recentOrders && Array.isArray(recentOrders)) {
        setOrders(recentOrders.map((o: any) => ({
           id: o.id,
           raw: o,
           name: o.items?.[0]?.name || `Order #${o.id.toString().substring(0, 6)}`,
           client: o.customer_name,
           price: `$${o.total_amount.toFixed(2)}`,
           status: o.status,
           statusKey: `status_${o.status.toLowerCase()}`,
           img: getImageUrl(o.items?.[0]?.img) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNBMxHvWdlMpfgp9l8A0EyIP2RQN9mGvVh2_c0NhpH8REYGT8Zykv4p6CGkkeK_dCnaB6NzP3ELi7MifKfwa342tZRmrkR6Z0LMJVuGH5gVfH083-lFs-HPlP3K6xtDjRHvUP35GOPb5E_mIaPXSl-oxdwQCSLstA9iDvf5klqYhcBvmq5uH5pL1WN0Yw-YYAkPU6qJX1gTfAfaS5_keqa_c-QlNxzvxeCY4IyWtFhqdASsaYSa-o_vlTdd-goO52ZIvs1FNN9pX78'
        })));
      }
      setModalType(null);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setIsUpdating(false);
  };

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} className="bg-[#ff6347]/5 py-4 rounded-2xl justify-center border border-[#ff6347]/20" />
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1">{t('admin_business_overview')}</h2>
          <p className="text-on-surface-variant font-medium text-sm">{t('admin_metrics_desc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-white/5 rounded-lg text-xs font-bold uppercase  hover:bg-white/5 transition-all text-on-surface">
            <span className="material-symbols-outlined text-sm">download</span> {t('admin_export_log')}
          </button>
          <Link href="/admin/products" className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary-container rounded-lg text-xs font-black uppercase  shadow-[0_0_20px_rgba(145,247,142,0.2)] hover:shadow-[0_0_40px_rgba(145,247,142,0.4)] transition-all">
            <span className="material-symbols-outlined text-sm">add</span> {t('admin_new_product')}
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="p-6 rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(145,247,142,0.03)] border border-white/5 bg-surface-container">
          <div className="relative z-10 flex justify-between items-start">
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <p className="text-xs font-headline font-bold uppercase  text-on-surface-variant">{t('admin_gross_revenue')}</p>
              <h3 className="text-3xl font-headline font-bold mt-2 text-on-surface">${loading ? '...' : stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <div className="flex items-center gap-1 mt-4 text-secondary text-xs font-bold">
                <span className={`material-symbols-outlined text-sm ${dir === 'rtl' ? 'scale-x-[-1]' : ''}`}>trending_up</span>
                <span>+12.4% {t('admin_this_month')}</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
          </div>
          <div className="mt-6 h-16 w-full opacity-50 flex items-end gap-1" dir="ltr">
            <div className="w-full bg-primary/20 h-[30%] rounded-t-sm"></div>
            <div className="w-full bg-primary/20 h-[50%] rounded-t-sm"></div>
            <div className="w-full bg-primary/20 h-[45%] rounded-t-sm"></div>
            <div className="w-full bg-primary/40 h-[70%] rounded-t-sm"></div>
            <div className="w-full bg-primary/30 h-[60%] rounded-t-sm"></div>
            <div className="w-full bg-secondary h-[90%] rounded-t-sm shadow-[0_0_10px_#2ff801]"></div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="p-6 rounded-2xl relative overflow-hidden group border border-white/5 bg-surface-container">
          <div className="relative z-10 flex justify-between items-start">
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <p className="text-xs font-headline font-bold uppercase  text-on-surface-variant">{t('admin_pending_orders')}</p>
              <h3 className="text-3xl font-headline font-bold mt-2 text-on-surface">{loading ? '...' : stats.pending.toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-4 text-secondary text-xs font-bold">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{loading ? '...' : stats.pending} {t('admin_awaiting_fulfillment')}</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>package_2</span>
            </div>
          </div>
          <div className="mt-6 h-16 w-full flex items-center justify-center">
            <div className="w-full h-1 bg-white/5 rounded-xl relative overflow-hidden">
              <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} w-[65%] bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_#2ff801]`}></div>
            </div>
          </div>
        </div>

        {/* Active Customers Card */}
        <div className="p-6 rounded-2xl relative overflow-hidden group border border-white/5 bg-surface-container">
          <div className="relative z-10 flex justify-between items-start">
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <p className="text-xs font-headline font-bold uppercase  text-on-surface-variant">{t('admin_active_customers')}</p>
              <h3 className="text-3xl font-headline font-bold mt-2 text-on-surface">{loading ? '...' : stats.customers.toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-4 text-error text-xs font-bold">
                <span className={`material-symbols-outlined text-sm ${dir === 'rtl' ? 'scale-x-[-1]' : ''}`}>trending_down</span>
                <span>-2.1% {t('admin_growth_rate')}</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-3xl">group</span>
            </div>
          </div>
          <div className={`mt-6 flex gap-2 overflow-hidden ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {stats.recentCustomers.map((user: any, idx: number) => (
              <div key={idx} className="w-8 h-8 rounded-xl border-2 border-surface bg-surface-container-high overflow-hidden" title={user.name}>
                <img 
                  className="w-full h-full object-cover" 
                  alt={user.name || 'User'} 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=64`} 
                />
              </div>
            ))}
            {stats.customers > stats.recentCustomers.length && (
              <div className="w-8 h-8 rounded-xl border-2 border-surface bg-white/10 flex items-center justify-center text-[10px] font-bold text-primary">
                +{stats.customers - stats.recentCustomers.length}
              </div>
            )}
            {stats.customers === 0 && (
              <div className="w-8 h-8 rounded-xl border-2 border-surface bg-white/10 flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                0
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Orders Table */}
        <section className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-extrabold text-on-surface">{t('admin_recent_orders')}</h2>
            <Link href="/admin/orders" className="text-xs font-headline font-bold text-primary uppercase  hover:underline transition-all">{t('admin_view_all_activity')}</Link>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-separate border-spacing-y-3`}>
              <thead>
                <tr className="text-on-surface-variant uppercase text-[10px] font-bold ]">
                  <th className="px-6 py-2">{t('admin_col_product')}</th>
                  <th className="px-6 py-2">{t('admin_col_client')}</th>
                  <th className="px-6 py-2">{t('admin_col_status')}</th>
                  <th className="px-6 py-2">{t('admin_col_customer_tier')}</th>
                  <th className="px-6 py-2">{t('admin_col_value')}</th>
                  <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant text-sm font-medium">{t('admin_recent_orders_empty')}</td>
                  </tr>
                ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group cursor-pointer relative">
                    <td className={`px-6 py-4 ${dir === 'rtl' ? 'rounded-r-2xl' : 'rounded-l-2xl'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden">
                          <img className="w-full h-full object-cover shadow-lg" alt={order.name} src={getImageUrl(order.img)} />
                        </div>
                        <span className="text-sm font-semibold">{order.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-on-surface-variant">{order.client}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-xl shadow-sm ${
                        order.status.toLowerCase() === 'delivered' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 
                        order.status.toLowerCase() === 'shipped' ? 'bg-primary/10 text-primary border border-primary/20' : 
                        order.status.toLowerCase() === 'pending' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' : 
                        order.status.toLowerCase() === 'processing' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' : 
                        order.status.toLowerCase() === 'cancelled' ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30' : 
                        'bg-white/5 text-on-surface-variant border border-white/10'
                      }`}>
                        {t(order.statusKey)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1" dir="ltr">
                        <div className="w-2 h-4 bg-primary rounded-xl"></div>
                        <div className="w-2 h-4 bg-primary rounded-xl"></div>
                        <div className={`w-2 h-4 ${order.id?.toString().includes('1') ? 'bg-primary' : 'bg-white/10'} rounded-xl`}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-headline font-bold text-sm">{order.price}</td>
                    <td className={`px-6 py-4 ${dir === 'rtl' ? 'rounded-l-2xl text-left' : 'rounded-r-2xl text-right'} relative`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === order.id ? null : order.id); }}
                        className="material-symbols-outlined text-on-surface-variant group-hover:text-primary p-1 hover:bg-white/10 rounded"
                      >
                        more_vert
                      </button>
                      {activeMenuId === order.id && (
                        <div className={`absolute top-12 ${dir === 'rtl' ? 'left-6' : 'right-6'} w-40 bg-surface-container-highest border border-primary/20 rounded-xl shadow-2xl z-[100] p-1 overflow-hidden animate-in fade-in zoom-in-95`}>
                          <button 
                            onClick={() => { setSelectedOrder(order.raw); setModalType('details'); setActiveMenuId(null); }}
                            className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 text-[10px] font-bold uppercase  hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-2 rounded-lg ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span> {t('admin_view_order_details')}
                          </button>
                          <button 
                            onClick={() => { setSelectedOrder(order.raw); setModalType('status'); setActiveMenuId(null); }}
                            className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 text-[10px] font-bold uppercase  hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-2 rounded-lg ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span> {t('admin_update_status')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Minimal Dashboard Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 text-xs">
              <span className="text-on-surface-variant px-4 font-bold opacity-50 uppercase ">{t('admin_showing')} {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, orders.length)} {t('admin_of')} {orders.length}</span>
              <div className={`flex items-center gap-1 px-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-inherit"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                 <span className="text-on-surface font-black shrink-0 px-2">{currentPage} / {totalPages}</span>
                 <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-inherit"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>
          )}
        </section>

        {/* Sidebar Stats */}
        <aside className="space-y-8">
          <div className={`p-8 rounded-3xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-primary bg-surface-container`}>
            <h2 className="text-lg font-headline font-extrabold mb-6 text-on-surface">{t('admin_inventory_status')}</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-headline font-bold uppercase  text-on-surface-variant">{t('filter_all')}</span>
                  <span className="text-xs font-bold text-primary">94%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-xl overflow-hidden">
                  <div className={`h-full bg-primary rounded-xl `} style={{width: '94%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-headline font-bold uppercase  text-on-surface-variant">{t('admin_low_warning')}</span>
                  <span className="text-xs font-bold text-secondary">15%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-xl overflow-hidden">
                  <div className={`h-full bg-secondary rounded-xl `} style={{width: '15%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="p-6 rounded-3xl bg-white/5 relative overflow-hidden group border border-outline-variant/10">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-xl blur-3xl group-hover:bg-primary/10 transition-all"></div>
            <h2 className="text-sm font-headline font-extrabold mb-4 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-lg">description</span>
              {t('admin_internal_notes')}
            </h2>
            <div className="space-y-4">
              {stats.internalNotes.length === 0 ? (
                <p className="text-[10px] text-on-surface-variant opacity-50 ">{t('admin_recent_orders_empty')}</p>
              ) : (
                stats.internalNotes.map((note: any, idx: number) => (
                  <div key={idx} className={`p-3 bg-surface-container rounded-lg ${dir === 'rtl' ? 'border-r-2' : 'border-l-2'} border-secondary`}>
                    <p className={`text-[11px] leading-relaxed text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>&quot;{note.notes}&quot;</p>
                    <p className={`text-[9px] mt-2 uppercase font-bold text-primary ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {note.customer_name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {modalType === 'details' && selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-highest border border-primary/20 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-primary/10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black font-headline  text-primary uppercase mb-1">Order #VL-{selectedOrder.id.toString().substring(0,6).toUpperCase()}</h3>
                <p className="text-xs text-on-surface-variant/60 font-medium">Placed on {new Date(selectedOrder.createdAt || selectedOrder.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase  text-primary/50 mb-3">{t('admin_col_client')}</p>
                  <p className="font-bold text-on-surface">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-on-surface-variant mt-1">{selectedOrder.customer_email}</p>
                  <p className="text-sm text-on-surface-variant mt-1">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase  text-primary/50 mb-3">Shipping Logistics</p>
                  <p className="font-bold text-on-surface">{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-on-surface-variant mt-1">{selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="mb-8 p-6 bg-surface-container rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase  text-primary/50 mb-3">{t('admin_internal_notes')}</p>
                  <p className="text-sm text-on-surface-variant  leading-relaxed">&quot;{selectedOrder.notes}&quot;</p>
                </div>
              )}

              {/* Payment Info */}
              <div className="mb-8 p-4 rounded-2xl border flex items-center justify-between gap-4"
                style={{
                  background: selectedOrder.payment_status === 'paid' 
                    ? 'rgba(47,248,1,0.04)' 
                    : selectedOrder.payment_status === 'pending'
                    ? 'rgba(251,191,36,0.04)'
                    : 'rgba(239,68,68,0.04)',
                  borderColor: selectedOrder.payment_status === 'paid' 
                    ? 'rgba(47,248,1,0.2)' 
                    : selectedOrder.payment_status === 'pending'
                    ? 'rgba(251,191,36,0.2)'
                    : 'rgba(239,68,68,0.2)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedOrder.payment_status === 'paid' ? 'bg-primary/10 text-primary' 
                    : selectedOrder.payment_status === 'pending' ? 'bg-amber-400/10 text-amber-400'
                    : 'bg-error/10 text-error'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {selectedOrder.payment_method === 'card' ? 'credit_card' :
                       selectedOrder.payment_method === 'wallet' ? 'account_balance_wallet' : 'local_shipping'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-0.5">
                      {t('checkout_payment_method')}
                    </p>
                    <p className="text-sm font-bold text-on-surface">
                      {selectedOrder.payment_method === 'card' ? (t('checkout_credit_card') || 'Credit Card') :
                       selectedOrder.payment_method === 'wallet' ? (t('checkout_digital_wallet') || 'Digital Wallet') :
                       (t('checkout_pay_on_delivery') || 'Pay on Delivery')}
                    </p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase  ${
                  selectedOrder.payment_status === 'paid'
                    ? 'bg-primary/15 text-primary'
                    : selectedOrder.payment_status === 'pending'
                    ? 'bg-amber-400/15 text-amber-400'
                    : 'bg-error/15 text-error'
                }`}>
                  {selectedOrder.payment_status === 'paid' 
                    ? `✓ ${t('payment_paid') || 'Paid'}` 
                    : selectedOrder.payment_status === 'pending'
                    ? `⏳ ${t('payment_pending') || 'Pending'}`
                    : `✕ ${t('payment_unpaid') || 'Unpaid'}`}
                </span>
              </div>
              

              <div className="space-y-4">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden border border-white/10">
                        <img className="w-full h-full object-cover" src={getImageUrl(item.img)} alt={item.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60">ID: {item.product_id.toString().substring(0,8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">x{item.quantity}</p>
                      <p className="text-[11px] font-bold text-on-surface-variant">@ ${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-primary/5 border-t border-primary/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-1">{t('admin_col_value')}</p>
                <p className="text-2xl font-black font-headline text-on-surface">${selectedOrder.total_amount.toFixed(2)}</p>
              </div>
              <button 
                onClick={() => setModalType('status')}
                className="px-6 py-3 bg-primary text-on-primary-container font-black text-[10px] uppercase ] rounded-xl shadow-lg hover: transition-all"
              >
                {t('admin_update_status')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'status' && selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-highest border border-primary/20 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-primary/10 flex justify-between items-center">
               <h3 className="text-xl font-black font-headline  text-primary uppercase">{t('admin_update_status')}</h3>
               <button onClick={() => setModalType(null)} className="p-1 hover:bg-white/10 rounded-xl transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-2">Current Status</p>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase  inline-block ${
                   selectedOrder.status === 'delivered' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                }`}>
                  {t(`status_${selectedOrder.status.toLowerCase()}`)}
                </span>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase  ml-1 text-on-surface-variant">Update Logistic Node</p>
                <div className="grid grid-cols-2 gap-3">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button 
                      key={st}
                      onClick={() => updateOrderStatus(selectedOrder.id, st)}
                      disabled={isUpdating}
                      className={`p-4 rounded-2xl border text-[10px] font-black uppercase  flex items-center gap-2 transition-all group ${
                        selectedOrder.status === st ? 'bg-primary border-primary text-on-primary shadow-lg scale-105' : 'bg-white/5 border-white/5 hover:border-primary/50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-xl ${selectedOrder.status === st ? 'bg-white' : 'bg-primary '}`}></span>
                      {t(`status_${st}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {isUpdating && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-xl animate-spin"></div>
              </div>
            )}
            <div className="p-8 pt-0">
               <button onClick={() => setModalType(null)} className="w-full py-4 text-[10px] font-black uppercase ] text-on-surface-variant hover:text-primary transition-all">{t('checkout_return')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
