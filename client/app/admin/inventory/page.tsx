'use client';
import { useState, useEffect } from 'react';
import { useLang } from '@/components/LanguageProvider';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function InventoryTracking() {
  const { t, dir } = useLang();
  const router = useRouter();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStock: 0, lowStock: 0, inStockRate: 0, shippingCount: 0, returnedCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stockFilter]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    price: 0,
    category_id: 1
  });

  const fetchInventory = async () => {
    try {
      const data = await fetchApi('/products?admin=true');
      if (data && Array.isArray(data)) {
        setInventory(data.map((p: any) => ({
           id: p._id || p.id,
           name: p.name,
           sku: `VL-PRD-${(p._id || p.id).toString().substring(0,6).toUpperCase()}`,
           stock: p.stock,
           price: `$${p.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
           status: p.stock > 50 ? 'Healthy' : p.stock > 10 ? 'Warning' : 'Depleted',
           labId: `Zone ${p.category_id || 1}-A`
        })));
        const total = data.reduce((sum: number, p: any) => sum + p.stock, 0);
        const low = data.filter((p: any) => p.stock <= 10).length;
        const rate = data.length > 0 ? ((data.filter((p: any) => p.stock > 0).length / data.length) * 100).toFixed(1) : '0';

        // Fetch order stats
        let shippingCount = 0;
        let returnedCount = 0;
        try {
          const orders = await fetchApi('/orders');
          if (orders && Array.isArray(orders)) {
            shippingCount = orders.filter((o: any) => o.status === 'Shipped' || o.status === 'En Route').length;
            returnedCount = orders.filter((o: any) => o.status === 'Cancelled' || o.status === 'cancelled').length;
          }
        } catch (_) {}

        setStats({ totalStock: total, lowStock: low, inStockRate: Number(rate), shippingCount, returnedCount });
      }
    } catch (e) {
      console.error('Failed to load inventory', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    // Parse numeric price from string "$500.00"
    const numericPrice = parseFloat(item.price.replace(/[$,]/g, ''));
    // Extract zone number from labId string "Zone X-A"
    const zoneMatch = item.labId.match(/\d+/);
    const zoneNum = zoneMatch ? parseInt(zoneMatch[0]) : 1;
    setFormData({
      name: item.name,
      stock: item.stock,
      price: numericPrice,
      category_id: zoneNum
    });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi(`/products/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          stock: formData.stock,
          price: formData.price,
          category_id: formData.category_id
        })
      });
      setIsEditModalOpen(false);
      fetchInventory();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update inventory');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const searchVal = searchQuery.toLowerCase().trim();
    const matchesSearch = !searchVal || item.name.toLowerCase().includes(searchVal) || item.sku.toLowerCase().includes(searchVal);
    const matchesStock = stockFilter === 'all' || item.status === stockFilter;
    return matchesSearch && matchesStock;
  });

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full" dir={dir}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
          <h2 className="text-4xl font-black font-headline  text-on-surface uppercase mb-1">{t('admin_inventory_title')}</h2>
          <p className="text-on-surface-variant font-medium text-sm">{t('admin_inventory_desc')}</p>
        </div>
        <button onClick={() => router.push('/admin/products')} className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary-container rounded-lg text-[10px] font-black uppercase  shadow-[0_0_20px_rgba(145,247,142,0.2)] hover:shadow-[0_0_40px_rgba(145,247,142,0.4)] transition-all">
          <span className="material-symbols-outlined text-sm">add</span> {t('admin_new_product')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className={`bg-surface-container p-6 rounded-2xl border-s-4 border-primary/20 shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_total_stock')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.totalStock.toLocaleString()}</h3>
          <p className="text-[10px] mt-2 font-bold text-primary uppercase">+4.2% {t('admin_growth_label')}</p>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl border-s-4 border-secondary/20 shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_in_stock_rate')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : `${stats.inStockRate}%`}</h3>
          <p className="text-[10px] mt-2 font-bold text-secondary uppercase">{t('admin_optimized')}</p>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl border-s-4 border-error/20 shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_low_warning')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.lowStock}</h3>
          <p className="text-[10px] mt-2 font-bold text-error uppercase">{t('admin_needs_attention')}</p>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl border-s-4 border-primary/20 shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{t('admin_shipping')}</p>
          <h3 className="text-2xl font-headline font-black text-on-surface">{loading ? '...' : stats.shippingCount}</h3>
          <p className="text-[10px] mt-2 font-bold text-primary uppercase">{t('admin_returned')}</p>
        </div>
        <div className={`bg-surface-container p-6 rounded-2xl border-s-4 border-error/40 shadow-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p className="text-on-surface-variant text-[10px] font-black uppercase ] mb-1">{dir === 'rtl' ? 'الطلبات الملغية' : 'Cancelled Orders'}</p>
          <h3 className="text-2xl font-headline font-black text-error">{loading ? '...' : stats.returnedCount}</h3>
          <p className="text-[10px] mt-2 font-bold text-error uppercase">{dir === 'rtl' ? 'ملغي' : 'Cancelled'}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center group mt-8">
         <div className="w-full md:w-96 relative">
            <span className={`absolute top-1/2 -translate-y-1/2 ${dir === 'rtl' ? 'right-4' : 'left-4'} material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors`}>search</span>
            <input 
              type="text" 
              placeholder={dir === 'rtl' ? 'البحث باسم المنتج أو الرمز...' : 'Search by name or SKU...'} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-surface-container border border-white/10 rounded-xl py-3 ${dir === 'rtl' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} text-sm font-bold text-on-surface outline-none focus:border-primary/50 transition-all`}
            />
         </div>
         
         <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className={`flex bg-surface-container border border-white/10 rounded-xl p-1 shrink-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
               {['all', 'Healthy', 'Warning', 'Depleted'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => setStockFilter(status)}
                    className={`px-4 py-2 text-[10px] font-black uppercase  rounded-lg transition-all ${stockFilter === status ? 'bg-primary text-black shadow-[0_0_15px_rgba(145,247,142,0.3)]' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                     {status === 'all' ? (dir === 'rtl' ? 'الكل' : 'All States') : t(`status_${status.toLowerCase()}`)}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-surface-container rounded-2xl overflow-hidden shadow-2xl border border-white/5 mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_product')}</th>
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_sku')}</th>
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_quantity')}</th>
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_unit_price')}</th>
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_warehouse_zone')}</th>
                <th className={`py-5 px-6 text-[10px] font-black uppercase ] text-on-surface-variant ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('admin_col_inventory_status')}</th>
                <th className="py-5 px-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5-hover">
              {paginatedInventory.length === 0 ? (
                 <tr><td colSpan={7} className="py-8 text-center text-xs opacity-50">{loading ? 'Loading...' : (dir === 'rtl' ? 'لم يتم العثور على منتجات تطابق بحثك' : 'No products found matching your search.')}</td></tr>
              ) : (
              paginatedInventory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-all group">
                  <td className={`py-5 px-6 font-bold text-sm  ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.name}</td>
                  <td className={`py-5 px-6 font-mono text-[11px] text-primary ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.sku}</td>
                  <td className={`py-5 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                     <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                       <span className="text-sm font-black">{item.stock}</span>
                       <div className="w-12 h-1 bg-white/5 rounded-xl overflow-hidden">
                          <div className={`h-full ${item.stock < 10 ? 'bg-error' : item.stock < 50 ? 'bg-secondary' : 'bg-primary'} rounded-xl`} style={{width: `${Math.min(item.stock/2, 100)}%`}}></div>
                       </div>
                     </div>
                  </td>
                  <td className={`py-5 px-6 font-black text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.price}</td>
                  <td className={`py-5 px-6 text-xs text-on-surface-variant font-bold ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.labId}</td>
                  <td className={`py-5 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase  ${
                      item.status === 'Healthy' ? 'bg-primary/10 text-primary' : 
                      item.status === 'Warning' ? 'bg-secondary/10 text-secondary' : 
                      'bg-error/10 text-error'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-xl ${
                        item.status === 'Healthy' ? 'bg-primary shadow-[0_0_8px_#91f78e]' : 
                        item.status === 'Warning' ? 'bg-secondary shadow-[0_0_8px_#2ff801]' : 
                        'bg-error'
                      }`}></span> {t(`status_${item.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className={`py-5 px-6 relative ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="material-symbols-outlined text-on-surface-variant group-hover:text-primary p-1 hover:bg-white/10 rounded transition-colors"
                    >more_vert</button>
                    {activeMenuId === item.id && (
                      <div className={`absolute top-12 ${dir === 'rtl' ? 'left-6 text-right' : 'right-6 text-left'} w-40 bg-[#0a0f0b] border border-[#91f78e]/30 rounded-xl shadow-2xl z-[100] p-1 overflow-hidden animate-in fade-in slide-in-from-top-2`}>
                         <button onClick={() => handleEditClick(item)} className={`w-full px-3 py-2 text-[10px] font-bold uppercase  hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-2 rounded-lg ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                          <span className="material-symbols-outlined text-sm">edit</span> {t('admin_edit_stock')}
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
             {t('admin_showing') || 'Showing'} {((currentPage - 1) * ITEMS_PER_PAGE) + 1} {t('admin_to') || 'to'} {Math.min(currentPage * ITEMS_PER_PAGE, filteredInventory.length)} {t('admin_of') || 'of'} {filteredInventory.length}
          </div>
          <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
             <div className="flex gap-1.5 hidden md:flex">
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rtl:text-right ltr:text-left">
           <form onSubmit={handleUpdateStock} className="bg-surface-container border border-primary/20 p-8 rounded-[2rem] shadow-2xl max-w-md w-full z-[101]">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                 <h3 className="text-xl font-headline font-black uppercase ">{t('admin_edit_stock')}</h3>
                 <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase  mb-2 opacity-50">{t('admin_col_product')}</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase  mb-2 opacity-50">{t('admin_col_quantity')}</label>
                        <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary font-bold" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase  mb-2 opacity-50">{t('admin_col_unit_price')} ($)</label>
                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary font-bold" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase  mb-2 opacity-50">{t('admin_col_warehouse_zone')}</label>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold opacity-50">Zone</span>
                        <input required type="number" value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary font-bold text-center" />
                        <span className="text-sm font-bold opacity-50">-A</span>
                    </div>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[8px] font-black uppercase  opacity-50 mb-2">Automated Status Calculation</p>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-xl ${formData.stock > 50 ? 'bg-primary shadow-[0_0_8px_#91f78e]' : formData.stock > 10 ? 'bg-secondary' : 'bg-error'}`}></span>
                        <span className="text-xs font-black uppercase ">{formData.stock > 50 ? 'Healthy' : formData.stock > 10 ? 'Warning' : 'Depleted'}</span>
                    </div>
                 </div>
              </div>
              <div className="mt-10 flex justify-end gap-4 border-t border-white/5 pt-6">
                 <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 text-xs font-bold uppercase  hover:text-on-surface-variant transition-colors">{t('common_cancel') || 'Cancel'}</button>
                 <button type="submit" className="px-6 py-2 bg-primary text-on-primary-container rounded-lg text-xs font-black uppercase  shadow-[0_0_20px_rgba(145,247,142,0.2)]">
                   {t('common_save') || 'Save Changes'}
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
