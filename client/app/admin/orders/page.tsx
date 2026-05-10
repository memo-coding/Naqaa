'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi, getImageUrl } from '@/lib/api';
import { useSocket } from '@/components/SocketProvider';

export default function OrdersManagement() {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { t, dir } = useLang();

  const [orders, setOrders] = useState<any[]>([]);
  const { socket } = useSocket();
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, processingOrders: 0, returns: 0 });
  useEffect(() => {
    if (socket) {
      socket.on('newOrder', () => {
        fetchOrders();
      });
      return () => {
        socket.off('newOrder');
      };
    }
  }, [socket]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'details' | 'status' | 'bulk_shipping' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isPaymentFilterOpen, setIsPaymentFilterOpen] = useState(false);

  // Shipping companies
  const [shippingCompanies, setShippingCompanies] = useState<any[]>([]);
  const [selectedShippingCompanyId, setSelectedShippingCompanyId] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter]);

  // Parse payment method from legacy notes for orders created before the payment_method field was added
  const inferPaymentMethod = (o: any): string => {
    if (o.payment_method) return o.payment_method;
    if (o.notes && o.notes.includes('[Payment Method: manual]')) return 'manual';
    if (o.notes && o.notes.includes('[Payment Method: wallet]')) return 'wallet';
    if (o.notes && o.notes.includes('[Payment Method: card]')) return 'card';
    return 'card'; // true legacy default
  };

  const inferPaymentStatus = (o: any): string => {
    if (o.payment_status) return o.payment_status;
    const method = inferPaymentMethod(o);
    return method === 'manual' ? 'unpaid' : 'pending';
  };

  const filteredOrders = orders.filter(o => {
    const searchVal = searchQuery.toLowerCase().trim();
    const customerName = (o.customer || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();
    const statusVal = (o.status || '').toLowerCase();
    const paymentStatusVal = (o.payment_status || 'unpaid').toLowerCase();

    const matchesSearch = !searchVal || customerName.includes(searchVal) || orderId.includes(searchVal);
    const matchesStatus = statusFilter === 'all' || statusVal === statusFilter.toLowerCase();
    const matchesPayment = paymentFilter === 'all' || paymentStatusVal === paymentFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPayment;
  });

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await fetchApi('/orders', { cache: 'no-store' });
      if (data) {
        setOrders(data.map((o: any) => ({
          id: `#ORD-${o.id.toString().substring(0, 6).toUpperCase()}`,
          rawId: o.id,
          raw: o, // Full object
          customer: o.customer_name,
          initials: o.customer_name.substring(0, 2).toUpperCase(),
          items: o.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ') || 'Unknown items',
          total: `$${o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          status: o.status,
          payment_method: inferPaymentMethod(o),
          payment_status: inferPaymentStatus(o),
          date: new Date(o.created_at).toLocaleDateString()
        })));

        const rev = data.reduce((sum: number, o: any) => sum + o.total_amount, 0);
        const active = data.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length;
        const processing = data.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
        const returns = data.filter((o: any) => o.status === 'cancelled').length;

        setStats({ revenue: rev, activeOrders: active, processingOrders: processing, returns });
      }
    } catch (e: any) {
      console.error('Failed to load orders', e);
      setError(e.message || 'Failed to load orders');
    }
    setLoading(false);
  }

  const loadShippingCompanies = async () => {
    try {
      const data = await fetchApi('/shipping', { cache: 'no-store' });
      const companies = Array.isArray(data) ? data : (data?.companies || []);
      setShippingCompanies(companies.filter((c: any) => c.is_active !== false));
    } catch (e) {
      console.error('Failed to load companies:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.rawId));
    }
  };

  const handleMarkAsShipped = async () => {
    if (selectedOrders.length > 0) {
      setModalType('bulk_shipping');
      loadShippingCompanies();
    }
  };

  const confirmBulkShipping = async () => {
    if (!selectedShippingCompanyId) {
      alert(dir === 'rtl' ? 'الرجاء اختيار شركة الشحن أولاً' : 'Please select a shipping company first');
      return;
    }
    setIsUpdating(true);
    try {
      await Promise.all(selectedOrders.map(id => fetchApi(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'shipped', shipping_company_id: selectedShippingCompanyId })
      })));
      setSelectedOrders([]);
      await fetchOrders();
      setModalType(null);
      setSelectedShippingCompanyId('');
    } catch (err) {
      console.error('Failed to update orders', err);
    }
    setIsUpdating(false);
  };

  const updateSingleOrderStatus = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'shipped' && selectedShippingCompanyId) {
        body.shipping_company_id = selectedShippingCompanyId;
      }
      await fetchApi(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      await fetchOrders();
      setModalType(null);
      setSelectedShippingCompanyId('');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setIsUpdating(false);
  };

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      {error && (
        <div className="mb-6">
          <div className="bg-[#ff6347]/10 border border-[#ff6347]/20 p-4 rounded-2xl flex items-center justify-between gap-4">
            <p className="text-[#ff6347] text-xs font-bold">{error}</p>
            <button onClick={() => { setError(''); fetchOrders(); }} className="px-4 py-2 bg-[#ff6347] text-white rounded-lg text-[10px] font-black uppercase ">Retry</button>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1">{t('admin_orders_title')}</h2>
          <p className="text-on-surface-variant font-medium text-sm">{t('admin_orders_desc')}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-primary shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_total_revenue')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">${loading ? '...' : stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <div className={`flex items-center gap-1 mt-2 text-secondary text-xs font-bold ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>12% {t('admin_from_last_month')}</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-secondary shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_active_orders')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.activeOrders}</h3>
          <div className={`flex items-center gap-1 mt-2 text-primary text-xs font-bold ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="material-symbols-outlined text-xs">local_shipping</span>
            <span>{loading ? '...' : stats.activeOrders} {t('admin_out_for_delivery')}</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-primary shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_processing_orders')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.processingOrders}</h3>
          <div className={`flex items-center gap-1 mt-2 text-primary text-xs font-bold ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="material-symbols-outlined text-xs">sync</span>
            <span>{t('admin_preparing_shipment')}</span>
          </div>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-error shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_returns')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.returns}</h3>
          <div className={`flex items-center gap-1 mt-2 text-error text-xs font-bold ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="material-symbols-outlined text-xs">priority_high</span>
            <span>{t('admin_attention_required')}</span>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="bg-surface-container/50 p-6 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4 border border-white/5">
        <div className={`flex items-center gap-4 flex-1 min-w-[300px] ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1 group">
            <input
              className={`w-full bg-surface-container border-none rounded-xl py-3 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:ring-1 focus:ring-primary/50 outline-none transition-all`}
              placeholder={t('admin_search_orders_placeholder')}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors`}>search</span>
          </div>
          <div className="relative">
            <button
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsPaymentFilterOpen(false); }}
              className={`bg-surface-container px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold text-on-surface hover:bg-white/5 border border-white/5 transition-colors uppercase  text-[10px] ${statusFilter !== 'all' ? 'text-primary border-primary/50' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>{statusFilter === 'all' ? t('admin_filters') : t(`status_${statusFilter.toLowerCase()}`)}</span>
            </button>
            {isFilterOpen && (
              <div className={`absolute top-full mt-2 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 bg-surface-container-highest border border-white/10 rounded-xl shadow-2xl p-2 w-48 space-y-1 animate-in fade-in slide-in-from-top-2`}>
                {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(stat => (
                  <button
                    key={stat}
                    onClick={() => { setStatusFilter(stat); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase  rounded-lg transition-colors ${statusFilter === stat ? 'bg-primary text-on-primary-container' : 'hover:bg-white/5 text-on-surface-variant'}`}
                  >
                    {stat === 'all' ? t('admin_all_statuses') : t(`status_${stat}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => { setIsPaymentFilterOpen(!isPaymentFilterOpen); setIsFilterOpen(false); }}
              className={`bg-surface-container px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold text-on-surface hover:bg-white/5 border border-white/5 transition-colors uppercase  text-[10px] ${paymentFilter !== 'all' ? 'text-primary border-primary/50' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>{paymentFilter === 'all' ? (t('payment_status') || 'Payment Status') : (t(`payment_${paymentFilter.toLowerCase()}`) || paymentFilter.toUpperCase())}</span>
            </button>
            {isPaymentFilterOpen && (
              <div className={`absolute top-full mt-2 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 bg-surface-container-highest border border-white/10 rounded-xl shadow-2xl p-2 w-48 space-y-1 animate-in fade-in slide-in-from-top-2`}>
                {['all', 'paid', 'pending', 'unpaid'].map(pStat => (
                  <button
                    key={pStat}
                    onClick={() => { setPaymentFilter(pStat); setIsPaymentFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase  rounded-lg transition-colors ${paymentFilter === pStat ? 'bg-primary text-on-primary-container' : 'hover:bg-white/5 text-on-surface-variant'}`}
                  >
                    {pStat === 'all' ? t('admin_all_payments') : (t(`payment_${pStat}`) || pStat.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          <button className="text-[10px] font-black uppercase  text-on-surface-variant px-4 py-3 hover:text-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">file_download</span>
            <span>{t('admin_export_csv')}</span>
          </button>
          <button onClick={handleMarkAsShipped} disabled={selectedOrders.length === 0} className={`bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase  flex items-center gap-2 transition-all active:scale-95 ${selectedOrders.length > 0 ? 'hover:bg-primary/20 shadow-[0_0_20px_rgba(145,247,142,0.1)]' : 'opacity-50 cursor-not-allowed'}`}>
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            <span>{t('admin_mark_as_shipped')} {selectedOrders.length > 0 && `(${selectedOrders.length})`}</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} border-collapse-hover`}>
            <thead>
              <tr className="bg-white/5 border-b border-white/5 font-headline">
                <th className="py-5 px-6 shrink-0"><input checked={orders.length > 0 && selectedOrders.length === orders.length} onChange={handleToggleSelectAll} className="rounded border-white/10 bg-surface-container text-primary focus:ring-primary" type="checkbox" /></th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_order_id')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_client')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_items')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_value')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_status')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('checkout_payment_method')}</th>
                <th className="py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant">{t('admin_col_date')}</th>
                <th className="py-5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-body">
              {paginatedOrders.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-xs opacity-50">{loading ? 'Loading...' : 'No orders found match your search/filter.'}</td></tr>
              )}
              {paginatedOrders.length > 0 && (
                paginatedOrders.map((order) => (
                  <tr key={order.rawId} className={`hover:bg-white/5 transition-colors group ${selectedOrders.includes(order.rawId) ? 'bg-primary/5' : ''}`}>
                    <td className="py-5 px-6"><input checked={selectedOrders.includes(order.rawId)} onChange={() => handleToggleSelect(order.rawId)} className="rounded border-white/10 bg-surface-container text-primary focus:ring-primary" type="checkbox" /></td>
                    <td className="py-5 px-6 font-mono text-sm text-primary font-bold">{order.id}</td>
                    <td className="py-5 px-6">
                      <div className={`flex items-center gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 uppercase ">{order.initials}</div>
                        <span className={`text-sm font-bold ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{order.customer}</span>
                      </div>
                    </td>
                    <td className={`py-5 px-6 text-xs text-on-surface-variant font-medium ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{order.items}</td>
                    <td className={`py-5 px-6 text-sm font-black text-on-surface ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{order.total}</td>
                    <td className={`py-5 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase  ${order.status.toLowerCase() === 'delivered' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                          order.status.toLowerCase() === 'shipped' ? 'bg-primary/10 text-primary border border-primary/20' :
                            order.status.toLowerCase() === 'pending' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' :
                              order.status.toLowerCase() === 'processing' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                                order.status.toLowerCase().includes('cancelled') ? 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30' :
                                  'bg-white/5 text-on-surface-variant border border-white/10'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-xl ${order.status.toLowerCase() === 'delivered' ? 'bg-secondary drop-shadow-[0_0_5px_var(--accent-glow)]' :
                            order.status.toLowerCase() === 'shipped' ? 'bg-primary animate-pulse shadow-[0_0_8px_var(--accent-glow)]' :
                              order.status.toLowerCase() === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                order.status.toLowerCase() === 'processing' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                  order.status.toLowerCase().includes('cancelled') ? 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                    'bg-white/40'
                          }`}></span> {t(`status_${order.status.toLowerCase()}`)}
                      </span>
                    </td>
                    {/* Payment Status Cell */}
                    <td className={`py-5 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase  ${order.payment_status === 'paid' ? 'bg-primary/10 text-primary border border-primary/20' :
                            order.payment_status === 'pending' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                              'bg-red-500/10 text-red-400 border border-red-400/20'
                          }`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
                            {order.payment_method === 'card' ? 'credit_card' : order.payment_method === 'wallet' ? 'account_balance_wallet' : 'local_shipping'}
                          </span>
                          {order.payment_status === 'paid' ? t('payment_paid') || 'Paid' : order.payment_status === 'failed' ? t('payment_failed') || 'Failed' : order.payment_status === 'pending' && order.payment_method !== 'manual' ? t('payment_pending') || 'Pending Payment' : t('payment_unpaid') || 'Unpaid (COD)'}
                        </span>
                      </div>
                    </td>
                    <td className={`py-5 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'} relative`}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === order.rawId ? null : order.rawId)}
                        className="material-symbols-outlined text-on-surface-variant group-hover:text-primary p-1 hover:bg-white/10 rounded transition-colors"
                      >more_vert</button>
                      {activeMenuId === order.rawId && (
                        <div className={`absolute top-12 ${dir === 'rtl' ? 'left-6' : 'right-6'} w-40 bg-[#0a0f0b] border border-[#91f78e]/30 rounded-xl shadow-2xl z-[100] p-1 overflow-hidden animate-in fade-in zoom-in-95`}>
                          <button
                            onClick={() => { setSelectedOrder(order.raw); setModalType('details'); setActiveMenuId(null); }}
                            className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-3 py-2 text-[10px] font-bold uppercase  hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-2 rounded-lg ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span> {t('admin_view_order_details')}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order.raw);
                              setModalType('status');
                              setActiveMenuId(null);
                              loadShippingCompanies();
                            }}
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
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-white/5 shadow-sm mt-4">
          <div className="text-xs text-on-surface-variant font-medium">
            {t('admin_showing') || 'Showing'} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t('admin_to') || 'to'} {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} {t('admin_of') || 'of'} {filteredOrders.length}
          </div>
          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
            <div className="flex gap-1.5 hidden md:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? 'bg-primary text-black shadow-[0_0_10px_rgba(145,247,142,0.3)]' : 'bg-surface-container hover:bg-white/5 text-on-surface-variant border border-white/5'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
          </div>
        </div>
      )}

      {/* Featured Insight Card */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 relative h-64 rounded-3xl overflow-hidden border border-white/5 group shadow-2xl">
          <div className={`absolute inset-0 z-10 ${dir === 'rtl' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#0a0f0b] via-[#0a0f0b]/80 to-transparent`}></div>
          <img alt="Botanical Display" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv7WoxWia2V_t8rOVHma5U_eCnUmtJXgMp8xi0GlejuiFTHUeaYU8S3BCyC3u4ZtY5CrEVjdniuy6B7sBM9BX97QDFMIpDDpG6vw6DeV-9bgfcSKpVxhyfZOTjqmD8l0LAFfl05b6D0-E1vI-ZWZwdVKKKHNCXKa8U2vWLQB-tPoMmq_ykKCU0pLh5plnHMYWayRAaQ8G1s_hNOhlkIUewDclHbKK0_E2PEvzaVTQvGO6BqqdMKMsp6KsACd3y7Y5Cj1usPb8Hl9cn" />
          <div className={`relative z-20 h-full flex flex-col justify-center px-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <span className="text-primary font-black text-[10px] uppercase ] mb-4">{t('admin_ai_business_forecast')}</span>
            <h2 className="text-3xl font-headline font-black text-on-surface max-w-sm leading-tight  uppercase">
              {dir === 'rtl' ? (
                <>تحسين <span className="text-secondary drop-shadow-[0_0_10px_#2ff801]">{t('admin_shipping_speed')}</span>.</>
              ) : (
                <>Optimizing <span className="text-secondary drop-shadow-[0_0_10px_#2ff801]">{t('admin_shipping_speed')}</span>.</>
              )}
            </h2>
            <p className="text-on-surface-variant text-sm mt-4 max-w-sm font-medium leading-relaxed">{t('admin_shipping_logistics')}</p>
          </div>
        </div>
        <div className="bg-surface-container rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-primary blur-xl opacity-20 animate-pulse"></div>
            <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
          </div>
          <h4 className="font-black font-headline text-lg mb-2 uppercase ">{t('admin_inventory_forecast')}</h4>
          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed font-medium">{t('admin_stocking_suggestion')}</p>
          <button className="text-[10px] font-black uppercase ] text-primary hover:text-secondary transition-all">{t('admin_review_forecast')}</button>
        </div>
      </div>

      {/* Modals */}
      {modalType === 'details' && selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-highest border border-primary/20 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-primary/10 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black font-headline  text-primary uppercase mb-1">Order #ORD-{selectedOrder.id.toString().substring(0, 6).toUpperCase()}</h3>
                <p className="text-xs text-on-surface-variant/60 font-medium">Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
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
                  {selectedOrder.shipping_company_name && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl w-fit">
                      <span className="material-symbols-outlined text-xs text-primary">local_shipping</span>
                      <span className="text-[10px] font-bold uppercase  text-primary">{selectedOrder.shipping_company_name}</span>
                    </div>
                  )}
                </div>
              </div>

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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedOrder.payment_status === 'paid' ? 'bg-primary/10 text-primary'
                      : selectedOrder.payment_status === 'pending' ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-error/10 text-error'
                    }`}>
                    <span className="material-symbols-outlined text-xl">
                      {selectedOrder.payment_method === 'card' ? 'credit_card' :
                        selectedOrder.payment_method === 'wallet' ? 'account_balance_wallet' : 'local_shipping'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-0.5">{t('checkout_payment_method')}</p>
                    <p className="text-sm font-bold text-on-surface">
                      {selectedOrder.payment_method === 'card' ? (t('checkout_credit_card') || 'Credit Card') :
                        selectedOrder.payment_method === 'wallet' ? (t('checkout_digital_wallet') || 'Digital Wallet') :
                          (t('checkout_pay_on_delivery') || 'Pay on Delivery')}
                    </p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase  ${selectedOrder.payment_status === 'paid' ? 'bg-success/15 text-success' :
                    selectedOrder.payment_status === 'pending' ? 'bg-amber-400/15 text-amber-400' :
                      'bg-error/15 text-error'
                  }`}>
                  {selectedOrder.payment_status === 'paid'
                    ? `✓ ${t('payment_paid') || 'Paid'}`
                    : selectedOrder.payment_status === 'failed'
                      ? `✕ ${t('payment_failed') || 'Payment Failed'}`
                      : selectedOrder.payment_status === 'pending' && selectedOrder.payment_method !== 'manual'
                        ? `⏳ ${t('payment_pending') || 'Pending Payment'}`
                        : `✕ ${t('payment_unpaid') || 'Unpaid (COD)'}`}
                </span>
              </div>

              <p className="text-[10px] font-black uppercase  text-primary/50 mb-4">Constituent Specimens</p>
              <div className="space-y-4">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden border border-white/10">
                        <img className="w-full h-full object-cover" src={getImageUrl(item.img)} alt={item.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60">ID: {item.product_id.toString().substring(0, 8)}</p>
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
                className="px-6 py-3 bg-primary text-on-primary-container font-black text-[10px] uppercase ] rounded-xl shadow-lg hover:shadow-[0_0_20px_var(--accent-glow)] transition-all"
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
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase  inline-block ${selectedOrder.status === 'delivered' ? 'bg-secondary/20 text-secondary' :
                    selectedOrder.status.includes('cancelled') ? 'bg-error/20 text-error' :
                      'bg-primary/20 text-primary'
                  }`}>
                  {selectedOrder.status === 'pending' ? 'قيد الانتظار' :
                    selectedOrder.status === 'processing' ? 'جاري التجهيز' :
                      selectedOrder.status === 'shipped' ? '🚚 تم الشحن' :
                        selectedOrder.status === 'delivered' ? 'تم التسليم' :
                          selectedOrder.status === 'cancelled' ? 'مرتجع' :
                            'ملغي'}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase  ml-1 text-on-surface-variant">تحديث حالة الطلب</p>
                <div className="grid grid-cols-2 gap-3">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancelled_no_refund'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        if (st !== 'shipped') updateSingleOrderStatus(selectedOrder.id, st);
                      }}
                      disabled={isUpdating}
                      className={`p-4 rounded-2xl border text-[10px] font-black uppercase  flex items-center gap-2 transition-all group ${selectedOrder.status === st ? 'bg-primary border-primary text-on-primary shadow-lg scale-105' :
                          st === 'cancelled_no_refund' ? 'bg-error/5 border-error/20 hover:border-error/50 text-error' :
                            st === 'cancelled' ? 'bg-error/5 border-error/20 hover:border-error/50 text-error/70' :
                              'bg-white/5 border-white/5 hover:border-primary/50'
                        } ${st === 'shipped' ? 'col-span-2 opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-xl shrink-0 ${selectedOrder.status === st ? 'bg-white' : st.includes('cancelled') ? 'bg-error animate-pulse' : 'bg-primary animate-pulse shadow-[0_0_8px_var(--accent-glow)]'}`}></span>
                      {st === 'pending' ? 'قيد الانتظار' :
                        st === 'processing' ? 'جاري التجهيز' :
                          st === 'shipped' ? 'تم الشحن' :
                            st === 'delivered' ? 'تم التسليم' :
                              st === 'cancelled' ? 'مرتجع' :
                                'ملغي'}
                    </button>
                  ))}
                </div>

                {/* Shipping Company Selector */}
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-3">حدد شركة الشحن (ضروري لتحديث الحالة إلى تم الشحن)</p>
                  {shippingCompanies.length === 0 ? (
                    <p className="text-xs text-error font-medium">لا توجد شركات شحن. <a href="/admin/shipping" className="underline text-primary">أضف شركة أولاً</a></p>
                  ) : (
                    <>
                      <select
                        value={selectedShippingCompanyId}
                        onChange={e => setSelectedShippingCompanyId(e.target.value)}
                        className={`w-full bg-surface-container border ${!selectedShippingCompanyId ? 'border-amber-500/50' : 'border-white/10'} rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
                        dir={dir}
                      >
                        <option value="">-- اختر شركة الشحن --</option>
                        {shippingCompanies.map((c: any) => (
                          <option key={c._id || c.id} value={c._id || c.id}>{c.name} {c.name_ar ? `/ ${c.name_ar}` : ''} — {c.fees_per_order} EGP</option>
                        ))}
                      </select>
                      {selectedOrder.shipping_company_name && !selectedShippingCompanyId && (
                        <p className="text-[10px] text-on-surface-variant mt-2 opacity-60">الشركة الحالية: {selectedOrder.shipping_company_name}</p>
                      )}

                      <button
                        onClick={() => {
                          if (!selectedShippingCompanyId) {
                            alert(dir === 'rtl' ? 'الرجاء اختيار شركة الشحن أولاً' : 'Please select a shipping company first');
                            return;
                          }
                          updateSingleOrderStatus(selectedOrder.id, 'shipped');
                        }}
                        disabled={isUpdating || !selectedShippingCompanyId}
                        className={`mt-4 w-full py-4 bg-primary text-on-primary-container font-black text-[11px] uppercase  rounded-xl shadow-lg transition-all ${!selectedShippingCompanyId ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:shadow-[0_0_25px_var(--accent-glow)] active:scale-95'}`}
                      >
                        {isUpdating ? 'جاري التحديث...' : 'تغيير الحالة إلى [تم الشحن]'}
                      </button>
                    </>
                  )}
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

      {modalType === 'bulk_shipping' && selectedOrders.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-highest border border-primary/20 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-primary/10 flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">local_shipping</span>
                <h3 className="text-xl font-black font-headline  uppercase">{t('admin_mark_as_shipped')} ({selectedOrders.length})</h3>
              </div>
              <button onClick={() => setModalType(null)} className="p-1 hover:bg-white/10 rounded-xl transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[10px] font-black uppercase  text-on-surface-variant mb-3">حدد شركة الشحن للطلبات المحددة (ضروري)</p>
                {shippingCompanies.length === 0 ? (
                  <p className="text-xs text-error font-medium">⚠️ لا توجد شركات شحن. <a href="/admin/shipping" className="underline text-primary">أضف شركة أولاً</a></p>
                ) : (
                  <>
                    <select
                      value={selectedShippingCompanyId}
                      onChange={e => setSelectedShippingCompanyId(e.target.value)}
                      className={`w-full bg-surface-container border ${!selectedShippingCompanyId ? 'border-amber-500/50' : 'border-white/10'} rounded-xl py-3 px-4 text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
                      dir={dir}
                    >
                      <option value="">-- اختر شركة الشحن --</option>
                      {shippingCompanies.map((c: any) => (
                        <option key={c._id || c.id} value={c._id || c.id}>{c.name} {c.name_ar ? `/ ${c.name_ar}` : ''} — {c.fees_per_order} EGP</option>
                      ))}
                    </select>

                    <button
                      onClick={confirmBulkShipping}
                      disabled={isUpdating || !selectedShippingCompanyId}
                      className={`mt-4 w-full py-4 bg-primary text-on-primary-container font-black text-[11px] uppercase  rounded-xl shadow-lg transition-all ${!selectedShippingCompanyId ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:shadow-[0_0_25px_var(--accent-glow)] active:scale-95'}`}
                    >
                      {isUpdating ? 'جاري التحديث...' : 'تأكيد وشحن الطلبات'}
                    </button>
                  </>
                )}
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
